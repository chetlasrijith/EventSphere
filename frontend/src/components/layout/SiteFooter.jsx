import { Link } from 'react-router-dom';
import { Brand } from './chrome';

const COLUMNS = [
  {
    label: 'Attendees',
    links: [
      { to: '/', label: 'Upcoming events' },
      { to: '/search', label: 'Search events' },
      { to: '/attendee/login', label: 'Sign in' },
      { to: '/attendee/signup', label: 'Create an account' },
    ],
  },
  {
    label: 'Organizers',
    links: [
      { to: '/organizer/login', label: 'Sign in' },
      { to: '/organizer/signup', label: 'Publish an event' },
      { to: '/attendee/login', label: 'Attendee sign in' },
    ],
  },
  {
    label: 'Administration',
    links: [
      { to: '/admin/login', label: 'Admin sign in' },
      { to: '/admin/signup', label: 'Request access' },
    ],
  },
];

/** Site footer — a linen band, the last surface in the tone progression. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__cols">
          <div>
            <Brand />
            <p className="t-serif u-iron measure" style={{ marginTop: 'var(--spacing-16)' }}>
              A quiet place to plan, publish and attend events — from the first
              draft to the last ticket scanned at the door.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div className="footer-col" key={column.label}>
              <p className="footer-col__label">{column.label}</p>
              <div className="footer-col__links">
                {column.links.map((link) => (
                  <Link key={`${link.to}-${link.label}`} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="site-footer__base">
          <span className="t-mono">EventSphere</span>
          <span>Events, arranged calmly.</span>
        </div>
      </div>
    </footer>
  );
}