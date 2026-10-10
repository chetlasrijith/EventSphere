/**
 * Central API client.
 *
 * Every request previously carried its own base URL -- some read
 * `import.meta.env.VITE_BACKEND_SERVER`, others hardcoded
 * `http://localhost:8000`, and a few used relative `/api/...` paths that only
 * worked through the Vite dev proxy. This module is the single place that
 * decides where the API lives.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_SERVER || '';

export const api = axios.create({
  baseURL: BASE_URL,
  // The session is a cookie; without this the browser drops it.
  withCredentials: true,
});

/**
 * Pull a human-readable message out of an API error.
 *
 * The backend returns `{ detail, code, fields? }`. Validation failures put
 * per-field messages in `fields`, which are more useful than the generic
 * detail.
 */
export function errorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;

  if (data?.fields) {
    const messages = Object.values(data.fields);
    if (messages.length) return messages.join('. ');
  }
  if (data?.detail) return data.detail;
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Is the backend running?';
  }
  return fallback;
}

/** Build a URLSearchParams-style query, skipping empty values. */
export function query(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  return search;
}

export { BASE_URL };