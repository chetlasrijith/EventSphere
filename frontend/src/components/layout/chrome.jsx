import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/** Wordmark. The violet dot is the only accent allowed in the header. */
export function Brand({ role, to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand__mark" aria-hidden="true" />
      <span>EventSphere</span>
      {role && <span className="brand__role">{role}</span>}
    </Link>
  );
}

/**
 * Thin announcement strip above the nav.
 *
 * Dismissible for the session only — no persistence layer for a banner that
 * only exists to point at the current signup state.
 */
export function AnnouncementBanner() {
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem('eventsphere:banner') !== 'dismissed'
  );

  if (!visible) return null;

  return (
    <div className="announce">
      <div className="container">
        <div className="announce__inner">
          <p className="announce__text">
            <span className="t-mono u-smoke" style={{ marginRight: 12 }}>
              Note
            </span>
            Organizer accounts publish to a review queue — most events go live
            within a day.{' '}
            <Link to="/organizer/signup" className="link">
              Start organizing
            </Link>
          </p>
          <button
            type="button"
            className="announce__close"
            aria-label="Dismiss announcement"
            onClick={() => {
              sessionStorage.setItem('eventsphere:banner', 'dismissed');
              setVisible(false);
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dropdown trigger + panel.
 *
 * Closes on outside click, Escape and route change — the three ways a keyboard
 * or pointer user will try to dismiss it.
 */
export function Menu({ label, children, align = 'left', className = '' }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const { pathname } = useLocation();

  // Following a link inside the panel does not remount the header, so the
  // panel would otherwise stay open over the page it just navigated to.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`menu ${className}`.trim()} ref={root}>
      <button
        type="button"
        className="nav__link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <span className="nav__caret" aria-hidden="true" />
      </button>
      {open && (
        <div className={`menu__panel ${align === 'right' ? 'menu__panel--right' : ''}`}>{children}</div>
      )}
    </div>
  );
}

/** Hamburger for the mobile header. */
export function NavToggle({ open, onClick, controls }) {
  return (
    <button
      type="button"
      className="nav__toggle"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={onClick}
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
        {open ? (
          <path d="M1 1l16 12M17 1L1 13" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
    </button>
  );
}

/**
 * Search box in the header.
 *
 * Submits to /search with the term in state, matching the existing contract the
 * results page reads on mount.
 */
export function HeaderSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  return (
    <form
      role="search"
      className="header-search"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = term.trim();
        if (!trimmed) return;
        navigate('/search', { state: { term: trimmed } });
      }}
    >
      <input
        className="input"
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search events"
        aria-label="Search events"
        style={{ width: 200 }}
      />
      <button className="btn btn--hairline" type="submit">
        Search
      </button>
    </form>
  );
}