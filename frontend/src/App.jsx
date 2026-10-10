import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import SiteHeader from './components/layout/SiteHeader';
import RoleHeader from './components/layout/RoleHeader';
import SiteFooter from './components/layout/SiteFooter';

import AdminPathRouter from './pathRoutes/adminPathRoute';
import OrganizerPathRouter from './pathRoutes/organizerPathRoute';
import AttendeePathRouter from './pathRoutes/attendeePathRoute';

import AdminSignupForm from './pages/Auth/adminSignup';
import AdminLoginForm from './pages/Auth/adminLogin';
import OrganizerSignupForm from './pages/Auth/organizerSignup';
import OrganizerLoginForm from './pages/Auth/organizerLogin';
import AttendeeSignupForm from './pages/Auth/attendeeSignup';
import AttendeeLoginForm from './pages/Auth/attendeeLogin';

import HomePage from './pages/homePage';
import EventDetails from './pages/eventDetails';
import SearchEvents from './pages/Attendee/searchEvents';
import { currentRole } from './utils/auth';

const ADMIN_ROLES = ['admin', 'superadmin'];

/** Routes that own their entire layout and must not be wrapped in the shell. */
const BARE_ROUTES = [
  '/attendee/login',
  '/attendee/signup',
  '/organizer/login',
  '/organizer/signup',
  '/admin/login',
  '/admin/signup',
];

/** Top-level gate: sends a signed-out or wrong-role visitor to the login page. */
function RoleGate({ role, element }) {
  const active = currentRole()?.toLowerCase();
  const allowed = role === 'admin' ? ADMIN_ROLES.includes(active) : active === role;
  return allowed ? element : <Navigate to={`/${role}/login`} replace />;
}

/**
 * Chrome.
 *
 * Role is read from the JWT cookie rather than from state, so a reload after
 * login renders the right navigation without a refetch. The check re-runs on
 * every navigation, which keeps the header correct when a visitor moves
 * between a public page and a gated one.
 */
function Shell({ children }) {
  const { pathname } = useLocation();
  const role = currentRole();

  if (BARE_ROUTES.some((route) => pathname.startsWith(route))) {
    return <main className="app-main">{children}</main>;
  }

  const navKey = role === 'Admin' || role === 'SuperAdmin' ? 'admin' : role;

  return (
    <>
      {navKey ? <RoleHeader role={navKey} /> : <SiteHeader />}
      <main className="app-main">{children}</main>
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={3200}
        newestOnTop
        closeOnClick
        draggable={false}
        pauseOnFocusLoss={false}
        theme="light"
      />
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/eventDetails/:eventId" element={<EventDetails />} />
          <Route path="/search" element={<SearchEvents />} />

          <Route
            path="admin/*"
            element={<RoleGate role="admin" element={<AdminPathRouter />} />}
          />
          <Route
            path="organizer/*"
            element={<RoleGate role="organizer" element={<OrganizerPathRouter />} />}
          />
          <Route
            path="attendee/*"
            element={<RoleGate role="attendee" element={<AttendeePathRouter />} />}
          />

          <Route path="admin/signup" element={<AdminSignupForm />} />
          <Route path="admin/login" element={<AdminLoginForm />} />
          <Route path="organizer/signup" element={<OrganizerSignupForm />} />
          <Route path="organizer/login" element={<OrganizerLoginForm />} />
          <Route path="attendee/signup" element={<AttendeeSignupForm />} />
          <Route path="attendee/login" element={<AttendeeLoginForm />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </Router>
  );
}