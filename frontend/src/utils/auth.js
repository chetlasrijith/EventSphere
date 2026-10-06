/**
 * Session helpers built on the JWT cookie.
 *
 * The cookie is intentionally readable by JavaScript: `isAuthenticated` below
 * is what selects the navbar and gates routes by role. The token itself is
 * signed, so tampering with it changes the decoded role but never grants
 * server-side access -- every request is authorised again on the backend.
 */
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export function isAuthenticated() {
  const token = Cookies.get('jwt');
  if (!token) return false;

  try {
    const claims = jwtDecode(token);
    if (claims.exp * 1000 < Date.now()) {
      Cookies.remove('jwt');
      return false;
    }
    return claims;
  } catch (error) {
    console.error('Invalid token:', error);
    Cookies.remove('jwt');
    return false;
  }
}

export function currentRole() {
  const claims = isAuthenticated();
  return claims ? claims.role : null;
}

export function hasRole(...roles) {
  return roles.includes(currentRole());
}

export function clearSessionCookie() {
  Cookies.remove('jwt');
}