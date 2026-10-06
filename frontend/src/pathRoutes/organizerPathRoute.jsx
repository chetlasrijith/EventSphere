import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/protectedRoute';
import CreateEventForm from '../pages/Organizer/createEvent';
import EventList from '../pages/Organizer/eventList';
import OrganizerEventDetails from '../pages/Organizer/eventDetails';
import OrganizerProfile from '../pages/Profile/organizerProfile';
import NotificationList from '../pages/Organizer/notificationList';
import MessageAdmin from '../pages/Organizer/messageAdmin';
import UpdateToAttendee from '../pages/Organizer/updateToAttendee';

const organizer = (element) => <ProtectedRoute element={element} roles={['Organizer']} />;

export default function OrganizerPathRouter() {
  return (
    <Routes>
      <Route path="/" element={organizer(<EventList />)} />
      <Route path="create-event" element={organizer(<CreateEventForm />)} />
      <Route path="events" element={organizer(<EventList />)} />
      <Route path="events/:eventId" element={organizer(<OrganizerEventDetails />)} />
      <Route path="profile" element={organizer(<OrganizerProfile />)} />
      <Route path="notifications" element={organizer(<NotificationList />)} />
      <Route path="messageAdmin" element={organizer(<MessageAdmin />)} />
      <Route path="updateToAttendees" element={organizer(<UpdateToAttendee />)} />
    </Routes>
  );
}