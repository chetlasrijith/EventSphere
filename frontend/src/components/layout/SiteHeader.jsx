import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnnouncementBanner, Brand, HeaderSearch, Menu, NavToggle } from './chrome';
import Button from '../ui/Button';

const ROLE_LINKS = [
  { to: '/attendee/login', label: 'Attendee', hint: 'Find events, hold tickets' },
  { to: '/organizer/login', label: 'Organizer', hint: 'Publish and run events' },
  { to: '/admin/login', label: 'Admin', hint: 'Review, approve, oversee' },
];

/**
 * Public navigation.
 *
 * Signed-out visitors only. The role list is a dropdown rather than three flat
 * links because login is a fork, not a section of the site.
 */
export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header>
      <AnnouncementBanner />
      <div className="site-header">
        <div className="container">
          <div className="site-header__inner">
            <Brand />

            <nav className={`nav ${navOpen ? 'nav--open' : ''}`} id="public-nav">
              <Link to="/" className="nav__link">
                Events
              </Link>
              <Link to="/search" className="nav__link">
                Search
              </Link>
              <Menu label="Log in">
                {ROLE_LINKS.map((role) => (
                  <Link key={role.to} to={role.to} className="menu__item">
                    <span className="menu__label">{role.label}</span>
                    <span>{role.hint}</span>
                  </Link>
                ))}
              </Menu>
            </nav>

            <div className="nav__actions">
              <HeaderSearch />
              <Button to="/organizer/signup" variant="outline" size="sm">
                Create account
              </Button>
              <NavToggle
                open={navOpen}
                onClick={() => setNavOpen((v) => !v)}
                controls="public-nav"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}