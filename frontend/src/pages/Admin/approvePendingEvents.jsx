import React from 'react';
import AdminEvents from './AdminEvents';

/**
 * Thin wrappers so each status keeps its own URL for deep links.
 * The status is driven by the route, not by a query parameter.
 */
export default function ApprovePendingEvents() {
  return <AdminEvents status="pending" />;
}

export function ApprovedEvents() {
  return <AdminEvents status="approved" />;
}

export function CanceledEvents() {
  return <AdminEvents status="cancelled" />;
}

export function CompletedEvents() {
  return <AdminEvents status="completed" />;
}