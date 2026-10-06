import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/protectedRoute';
import AdminEvents, {
  ApprovedEvents,
  CanceledEvents,
  CompletedEvents,
} from '../pages/Admin/approvePendingEvents';
import OrganizersList from '../pages/Admin/organizersList';
import OrganizerProfile from '../pages/Admin/organizerProfile';
import MessageOrganizer from '../pages/Admin/messageOrganizer';
import AdminUpdateToAttendee from '../pages/Admin/updateToAttendee';
import AddArtist from '../pages/Admin/addArtist';
import NotificationList from '../pages/Admin/notificationList';
import AdminProfile from '../pages/Profile/adminProfile';

const admin = (element) => <ProtectedRoute element={element} roles={['Admin', 'SuperAdmin']} />;

export default function AdminPathRouter() {
  return (
    <Routes>
      {/* The review queue is the admin's landing page — it is the only route
          with an outstanding obligation on it. */}
      <Route path="/" element={admin(<AdminEvents status="pending" />)} />

      <Route path="add-artist" element={admin(<AddArtist />)} />
      <Route path="messageOrganizer" element={admin(<MessageOrganizer />)} />
      <Route path="update-to-attendees" element={admin(<AdminUpdateToAttendee />)} />

      <Route path="approve-pending-events" element={admin(<AdminEvents status="pending" />)} />
      <Route path="approved-events" element={admin(<ApprovedEvents />)} />
      <Route path="canceled-events" element={admin(<CanceledEvents />)} />
      <Route path="completed-events" element={admin(<CompletedEvents />)} />

      <Route path="list-organizers" element={admin(<OrganizersList />)} />
      <Route path="organizerProfile/:organizerId" element={admin(<OrganizerProfile />)} />

      <Route path="notifications" element={admin(<NotificationList />)} />
      <Route path="profile" element={admin(<AdminProfile />)} />
    </Routes>
  );
}