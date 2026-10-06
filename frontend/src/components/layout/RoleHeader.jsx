import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Brand, Menu, NavToggle } from './chrome';
import Button from '../ui/Button';
import {
  getAdminSummary,
  getAttendeeSummary,
  getOrganizerSummary,
  logout,
} from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { clearSessionCookie } from '../../utils/auth';

/**
 * Nav destinations per role.
 *
 * Admin deliberately leads with the review queue — it is the only page with an
 * unmet obligation on it. The rest are grouped so the five entries do not read
 * as one flat list of equal weight.
 */
const LINKS = {
  admin: {
    primary: [
      { to: '/admin/approve-pending-events', label: 'Review queue' },
      { to: '/admin/list-organizers', label: 'Organizers' },
      { to: '/admin/messageOrganizer', label: 'Messages' },
    ],
    secondary: [
      { to: '/admin/approved-events', label: 'Approved events' },
      { to: '/admin/canceled-events', label: 'Cancelled' },
      { to: '/admin/completed-events', label: 'Completed' },
      { to: '/admin/update-to-attendees', label: 'Broadcast' },
      { to: '/admin/add-artist', label: 'Add artist' },
      { to: '/admin/notifications', label: 'Notifications' },
    ],
  },
  organizer: {
    primary: [
      { to: '/organizer/events', label: 'My events' },
      { to: '/organizer/create-event', label: 'Create event' },
      { to: '/organizer/notifications', label: 'Notifications' },
    ],
    secondary: [
      { to: '/organizer/updateToAttendees', label: 'Notify attendees' },
      { to: '/organizer/messageAdmin', label: 'Contact admin' },
      { to: '/organizer/profile', label: 'Profile' },
    ],
  },
  attendee: {
    primary: [
      { to: '/attendee/myevent-list', label: 'My events' },
      { to: '/attendee/search-events', label: 'Search events' },
      { to: '/attendee/notifications', label: 'Notifications' },
    ],
    secondary: [
      { to: '/attendee/my-tickets', label: 'My tickets' },
      { to: '/attendee/profile', label: 'Profile' },
      { to: '/', label: 'Browse all events' },
    ],
  },
};

const SUMMARIES = {
  admin: getAdminSummary,
  organizer: getOrganizerSummary,
  attendee: getAttendeeSummary,
};

const ROLE_LABEL = {
  admin: 'Admin',
  organizer: 'Organizer',
  attendee: 'Attendee',
};

/**
 * Signed-in navigation.
 *
 * One component for all three roles. Logout is awaited and posted to the API
 * before the cookie is dropped, so the session actually ends server-side.
 */
export default function RoleHeader({ role }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const links = LINKS[role] || { primary: [], secondary: [] };

  useEffect(() => {
    let cancelled = false;
    const load = SUMMARIES[role];
    if (!load) return undefined;

    load()
      .then((summary) => {
        if (!cancelled) setName(summary?.name || summary?.username || '');
      })
      .catch(() => {
        // A failed name lookup must not break navigation.
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      toast.error(errorMessage(err, 'Sign out failed'));
    } finally {
      // Clear locally regardless: the cookie may already be gone, and the user
      // asked to sign out.
      clearSessionCookie();
      navigate(`/${role}/login`);
      window.location.reload();
    }
  };

  return (
    <div className="site-header">
      <div className="container">
        <div className="site-header__inner">
          <Brand role={ROLE_LABEL[role]} />

          <nav className={`nav ${navOpen ? 'nav--open' : ''}`} id="role-nav">
            {links.primary.map((link) => (
              <Link key={link.to} to={link.to} className="nav__link">
                {link.label}
              </Link>
            ))}
            {links.secondary.length > 0 && (
              <Menu label="More" align="right">
                {links.secondary.map((link) => (
                  <Link key={link.to} to={link.to} className="menu__item">
                    {link.label}
                  </Link>
                ))}
              </Menu>
            )}
          </nav>

          <div className="nav__actions">
            <Link to={`/${role}/profile`} className="identity">
              <span className="identity__meta">
                <span className="identity__name">{name || 'Your account'}</span>
                <span className="identity__role">{ROLE_LABEL[role]}</span>
              </span>
            </Link>
            <Button variant="hairline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
            <NavToggle open={navOpen} onClick={() => setNavOpen((v) => !v)} controls="role-nav" />
          </div>
        </div>
      </div>
    </div>
  );
}