# 🎉 EventSphere

EventSphere is a full-stack event management platform.  
It allows users to create, manage, and register for events with secure authentication and role-based access control.

**Frontend:** React + Vite. **Backend:** FastAPI + PostgreSQL (SQLAlchemy 2.0 async).

## ✨ Features

- 🔐 User Authentication (JWT-based, cookie session)
- 👥 Role-based Access (Admin / SuperAdmin / Organizer / Attendee)
- 📅 Create, Update, Delete Events with approval workflow
- 🎟️ Event Registration & Ticket Management
- 📂 Image Upload Support (Cloudinary)
- 🔒 Ownership checks on every mutating route
- 🔍 Event search

---

## Deployment

Recommended topology: Cloudflare Workers serves the React build and proxies
`/api/*` to a Dockerized FastAPI service. The browser sees one origin, so its
JWT cookie remains readable by the React role navigation without relying on
third-party cookies. PostgreSQL remains a separate managed service.

### Cloudflare Worker frontend

- Root directory: `frontend`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Wrangler serves `dist` and rewrites unknown app routes to `index.html` for
	React Router. The Worker handles `/api/*` before static assets.
- Add the Worker runtime variable `BACKEND_URL`, for example
	`https://eventsphere-api.example.com` (no `/api` suffix or trailing slash).
- Leave `VITE_BACKEND_SERVER` unset so production API calls use relative
	`/api/...` URLs and the Worker forwards them to FastAPI.

Set `BACKEND_URL` in the Cloudflare Worker settings and redeploy. The proxy
forwards API requests and responses, including the session cookie. Use
`COOKIE_SAMESITE=lax` for this same-origin browser setup.

### FastAPI and PostgreSQL

Build the API with `backend/Dockerfile` on a container host such as Render,
Railway, or Fly. Its startup command runs Alembic migrations before Uvicorn.
Set these variables on the API service:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=<generate-a-long-random-value>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=15
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://eventsphere.<your-workers-subdomain>.workers.dev
COOKIE_SAMESITE=lax
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

`JWT_SECRET` must not be the example value. Keep all backend secrets in the API
host's encrypted environment settings. The Cloudinary variables are required
for image uploads; without them, upload endpoints intentionally return an error.

### Local Docker

Copy `backend/.env.example` to `backend/.env`, replace `JWT_SECRET`, then run:

```bash
docker compose up --build
```

Compose starts PostgreSQL and the API on ports 5432 and 8000. Run the React dev
server separately with `cd frontend && npm run dev`. Local Vite requests go
directly to `http://localhost:8000`.

Cloudflare Workers serves the frontend, but PostgreSQL remains a separate
managed service. Cloudflare Containers can host the API image on a Workers Paid
plan; that requires additional Container and Durable Object configuration. For
direct browser calls to a separately hosted API, `COOKIE_SAMESITE=none` alone
is insufficient for this app because the frontend also needs to read the JWT
cookie; keep the same-origin Worker proxy or add shared-domain cookie support.

---

## 👤 Creating the first admin

Admin signup only creates a *pending* admin, and SuperAdmin is granted by email
allowlist rather than at registration — both deliberate, so nobody can
self-register with elevated rights. That leaves no in-app way to create the
first admin, so use the CLI:

```bash
cd backend
python -m app.db.create_admin --email founder@example.com --superadmin
```

Omit `--superadmin` for an ordinary admin. The password is prompted for without
echo unless you pass `--password`.

