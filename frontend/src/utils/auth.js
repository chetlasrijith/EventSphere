import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode"; // Explicitly import the ESM version

export const isAuthenticated = () => {
  const token = Cookies.get('jwt');
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken.exp * 1000 < Date.now();
      if (isExpired) {
        Cookies.remove('jwt');
        return false;
      }
      return decodedToken; // Return decoded token for role checking
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  }
  return false;
};
