/**
 * Typed API surface, grouped by role.
 *
 * Keeping every call in one module means a backend endpoint change is a
 * one-line edit here rather than a hunt through ~25 page components.
 */
import { api } from './client';

// --------------------------------------------------------------------------
// Public
// --------------------------------------------------------------------------

export const getBanners = () => api.get('/api/home/banners').then((r) => r.data);

export const getFeaturedEvents = (params) =>
  api.get('/api/home/events', { params }).then((r) => r.data);

export const getHomeStats = () => api.get('/api/home/stats').then((r) => r.data);

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

export const signupAttendee = (payload) =>
  api.post('/api/auth/attendee/signup', payload).then((r) => r.data);

export const signupOrganizer = (payload) =>
  api.post('/api/auth/organizer/signup', payload).then((r) => r.data);

export const signupAdmin = (payload) =>
  api.post('/api/auth/admin/signup', payload).then((r) => r.data);

export const login = (role, identifier, password) =>
  api.post(`/api/auth/${role}/login`, { identifier, password }).then((r) => r.data);

export const logout = () => api.post('/api/auth/logout').then((r) => r.data);

export const currentSession = () => api.get('/api/auth/me').then((r) => r.data);

// --------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------

export const listEvents = (params) =>
  api.get('/api/events', { params }).then((r) => r.data);

export const getEvent = (eventId) =>
  api.get(`/api/events/${eventId}`).then((r) => r.data);

export const searchEvents = (query) =>
  api.get('/api/events', { params: { search: query } }).then((r) => r.data);

// -- Organizer -------------------------------------------------------------

export const listMyEvents = (params) =>
  api.get('/api/events/mine', { params }).then((r) => r.data);

export const createEvent = (payload) =>
  api.post('/api/events', payload).then((r) => r.data);

export const updateEvent = (eventId, payload) =>
  api.patch(`/api/events/${eventId}`, payload).then((r) => r.data);

export const updateEventTags = (eventId, payload) =>
  api.patch(`/api/events/${eventId}/tags`, payload).then((r) => r.data);

export const updateEventSchedule = (eventId, payload) =>
  api.patch(`/api/events/${eventId}/schedule`, payload).then((r) => r.data);

export const uploadEventBanner = (eventId, file) => {
  const form = new FormData();
  form.append('banner', file);
  return api
    .put(`/api/events/${eventId}/banner`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const deleteEvent = (eventId) =>
  api.delete(`/api/events/${eventId}`).then((r) => r.data);

// -- Admin -----------------------------------------------------------------

export const approveEvent = (eventId) =>
  api.post(`/api/events/${eventId}/approval`).then((r) => r.data);

export const cancelEvent = (eventId, reason) =>
  api.post(`/api/events/${eventId}/cancellation`, { reason }).then((r) => r.data);

// --------------------------------------------------------------------------
// Attendee
// --------------------------------------------------------------------------

export const getMyProfile = () => api.get('/api/attendees/me').then((r) => r.data);

export const updateMyProfile = (payload) =>
  api.patch('/api/attendees/me', payload).then((r) => r.data);

export const uploadProfileImage = (file) => {
  const form = new FormData();
  form.append('profileImg', file);
  return api
    .put('/api/attendees/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const getAttendeeSummary = () =>
  api.get('/api/attendees/me/summary').then((r) => r.data);

export const myRegistrations = () =>
  api.get('/api/attendees/me/registrations').then((r) => r.data);

export const registerForEvent = (eventId) =>
  api.post(`/api/attendees/me/registrations/${eventId}`).then((r) => r.data);

export const cancelRegistration = (registrationId) =>
  api.delete(`/api/attendees/me/registrations/${registrationId}`).then((r) => r.data);

export const myTickets = () => api.get('/api/attendees/me/tickets').then((r) => r.data);

/**
 * Request a ticket. Booking id and secret code are generated server-side --
 * the browser no longer mints them, which it previously did, letting any
 * client claim an arbitrary booking id.
 */
export const issueTicket = (eventId) =>
  api.post('/api/attendees/me/tickets', { event_id: eventId }).then((r) => r.data);

// --------------------------------------------------------------------------
// Organizer
// --------------------------------------------------------------------------

export const getOrganizerProfile = () =>
  api.get('/api/organizers/me').then((r) => r.data);

export const updateOrganizerProfile = (payload) =>
  api.patch('/api/organizers/me', payload).then((r) => r.data);

export const getOrganizerSummary = () =>
  api.get('/api/organizers/me/summary').then((r) => r.data);

export const uploadOrganizerProfileImage = (file) => {
  const form = new FormData();
  form.append('profileImg', file);
  return api
    .put('/api/organizers/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const uploadOrganizerCoverImage = (file) => {
  const form = new FormData();
  form.append('coverImage', file);
  return api
    .put('/api/organizers/me/cover-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const setExperience = (list) =>
  api.put('/api/organizers/me/experience', list).then((r) => r.data);

export const setAchievements = (list) =>
  api.put('/api/organizers/me/achievements', list).then((r) => r.data);

export const messageAdmins = (payload) =>
  api.post('/api/organizers/me/messages', payload).then((r) => r.data);

export const broadcastToAttendees = (payload) =>
  api.post('/api/organizers/me/broadcasts', payload).then((r) => r.data);

// --------------------------------------------------------------------------
// Admin
// --------------------------------------------------------------------------

export const getAdminProfile = () => api.get('/api/admins/me').then((r) => r.data);

export const updateAdminProfile = (payload) =>
  api.patch('/api/admins/me', payload).then((r) => r.data);

export const getAdminSummary = () =>
  api.get('/api/admins/me/summary').then((r) => r.data);

export const listOrganizers = (params) =>
  api.get('/api/organizers', { params }).then((r) => r.data);

export const getOrganizer = (organizerId) =>
  api.get(`/api/admins/organizers/${organizerId}`).then((r) => r.data);

export const deleteOrganizer = (organizerId) =>
  api.delete(`/api/admins/organizers/${organizerId}`);

export const messageOrganizer = (organizerId, payload) =>
  api.post(`/api/admins/organizers/${organizerId}/messages`, payload).then((r) => r.data);

export const broadcastToAttendeesAsAdmin = (payload) =>
  api.post('/api/admins/broadcasts', payload).then((r) => r.data);

export const createArtist = (payload) =>
  api.post('/api/admins/artists', payload).then((r) => r.data);

export const listArtists = () => api.get('/api/admins/artists').then((r) => r.data);

export const getPendingAdmins = (params) =>
  api.get('/api/admins/pending/requests', { params }).then((r) => r.data);

export const approveAdmin = (adminId) =>
  api.post(`/api/admins/${adminId}/approval`).then((r) => r.data);

export const rejectAdmin = (adminId, reason) =>
  api.post(`/api/admins/${adminId}/rejection`, { reason }).then((r) => r.data);

// --------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------

const notificationPaths = {
  attendee: '/api/attendees',
  organizer: '/api/organizers',
  admin: '/api/admins',
};

export const listNotifications = (role, params) =>
  api.get(`${notificationPaths[role]}/notifications`, { params }).then((r) => r.data);

export const getNotification = (role, notificationId) =>
  api.get(`${notificationPaths[role]}/notifications/${notificationId}`).then((r) => r.data);

export const markNotificationRead = (role, notificationId) =>
  api
    .post(`${notificationPaths[role]}/notifications/${notificationId}/read`)
    .then((r) => r.data);