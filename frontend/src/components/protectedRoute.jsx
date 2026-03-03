import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js';

const ProtectedRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;
