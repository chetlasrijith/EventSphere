"""Create an admin account from the command line.

Admin signup only ever produces a *pending* admin, and SuperAdmin is granted by
email allowlist rather than at registration -- both deliberate, to stop anyone
self-registering with elevated rights. That leaves no in-app path to bootstrap
the very first admin, so this is the escape hatch.

Replaces the old `app.db.seed`, which also inserted demo events and attendees.

Examples
--------
Create an ordinary approved admin:

    python -m app.db.create_admin --email ops@example.com --password 'strong-pass'

Create the first SuperAdmin (also adds the email to the allowlist):

    python -m app.db.create_admin --email founder@example.com --password 'strong-pass' --superadmin
"""

from __future__ import annotations

import argparse
import asyncio
import getpass  # noqa: F401 - used in main
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import AdminStatus, UserRole
from app.models.user import Admin, SuperAdminWhitelist


async def create_admin(
    *, username: str, email: str, password: str, mobile: str | None, superadmin: bool
) -> Admin:
    async with SessionLocal() as session:
        existing = await session.scalar(select(Admin).where(Admin.email == email))
        if existing is not None:
            raise SystemExit(f"An admin already exists for {email} (id={existing.id}).")

        admin = Admin(
            username=username,
            email=email,
            password_hash=hash_password(password),
            mobile_number=mobile,
            # Created directly, so it skips the approval queue an in-app signup
            # would have to wait in.
            status=AdminStatus.APPROVED,
        )
        session.add(admin)
        await session.flush()

        if superadmin:
            session.add(SuperAdminWhitelist(email=email))
            await session.flush()
            # The role is derived from the allowlist at auth time, so the row
            # itself stays 'Admin'.
            print(f"Added {email} to the SuperAdmin allowlist.")

        await session.commit()
        await session.refresh(admin)
        return admin


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", required=True, help="login email")
    parser.add_argument("--username", help="display name; defaults to the email local-part")
    parser.add_argument("--password", help="omit to be prompted without echo")
    parser.add_argument("--mobile", help="optional 10-digit mobile number")
    parser.add_argument(
        "--superadmin",
        action="store_true",
        help="also grant SuperAdmin via the allowlist",
    )
    args = parser.parse_args()

    password = args.password
    if not password:
        password = getpass.getpass("Password: ") if sys.stdin.isatty() else input("Password: ")
    if len(password) < 6:
        raise SystemExit("Password must be at least 6 characters.")

    username = args.username or args.email.split("@")[0]

    admin = asyncio.run(
        create_admin(
            username=username,
            email=args.email,
            password=password,
            mobile=args.mobile,
            superadmin=args.superadmin,
        )
    )

    role = UserRole.SUPERADMIN.value if args.superadmin else UserRole.ADMIN.value
    print(f"Created {role} {admin.username} <{admin.email}> (id={admin.id}, approved).")


if __name__ == "__main__":
    main()