import { Link } from 'react-router-dom';
import { Brand } from './chrome';

const ROLE_SWITCH = [
  { role: 'attendee', label: 'Attendee', hint: 'Tickets, saved events' },
  { role: 'organizer', label: 'Organizer', hint: 'Publish, schedule, message' },
  { role: 'admin', label: 'Admin', hint: 'Review and approve' },
];

/**
 * Split layout for every authentication screen.
 *
 * The left plate is editorial — mono label, 300-weight headline, serif
 * paragraph — so signing in reads as a page of the publication rather than a
 * modal bolted onto one. The form sits in a white panel on the canvas.
 */
export default function AuthShell({ eyebrow, headline, lede, children, aside }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <div className="auth__home-link">
          <Brand />
        </div>
        <span className="eyebrow eyebrow--iron">{eyebrow}</span>
        <h1 className="t-display">{headline}</h1>
        {lede && <p className="t-serif u-iron measure--wide">{lede}</p>}
        {aside}
      </aside>

      <main className="auth__main">
        <div className="auth__panel">{children}</div>
      </main>
    </div>
  );
}

/** Footer of an auth screen: the other two roles, as quiet plates. */
export function RoleSwitch({ current, heading }) {
  const others = ROLE_SWITCH.filter((item) => item.role !== current);

  return (
    <div style={{ marginTop: 'var(--spacing-32)' }}>
      <p className="auth__divider">{heading}</p>
      <div className="role-grid" style={{ marginTop: 'var(--spacing-16)' }}>
        {others.map((item) => (
          <Link key={item.role} to={`/${item.role}/login`} className="role-option">
            <span className="t-mono">{item.label}</span>
            <span className="role-option__hint">{item.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Signature block shown on the auth aside. */
export function AuthAside({ title, children }) {
  return (
    <div>
      <Brand />
      <p className="t-heading-sm u-ink" style={{ marginTop: 'var(--spacing-24)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}