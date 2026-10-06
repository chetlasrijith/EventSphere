/**
 * Formatting helpers.
 *
 * The old backend pre-formatted dates into display strings ("March 5, 2026")
 * and shipped them as if they were values, so the browser could not localise
 * or reformat them. The API now returns ISO 8601 and formatting happens here,
 * in the viewer's locale and timezone.
 */

export function formatDate(value, options = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "3 hours ago" style relative time for notification lists. */
export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function formatPrice(value) {
  if (value === 0 || value === '0') return 'Free';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatAddress(address) {
  if (!address) return '';
  return [address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

export const EVENT_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const EVENT_STATUS_VARIANTS = {
  pending: 'warning',
  approved: 'success',
  cancelled: 'danger',
  completed: 'secondary',
};