import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole } from '../utils/auth';

/**
 * Route guard.
 *
 * This is a UX affordance only. The role check reads the JWT cookie in the
 * browser, which a user can edit; every route is authorised again on the
 * server, so bypassing this grants nothing.
 */
export default function ProtectedRoute({ element, roles }) {
  const location = useLocation();

  if (!roles.some((role) => hasRole(role))) {
    const fallback = roles.includes('SuperAdmin') ? 'admin' : roles[0].toLowerCase();
    return <Navigate to={`/${fallback}/login`} replace state={{ from: location }} />;
  }

  return element;
}