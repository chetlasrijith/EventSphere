import { Routes, Route } from 'react-router-dom';
import AddArtist from '../pages/Admin/addArtist.jsx';
import MessageOrganizer from '../pages/Admin/messageOrganizer.jsx';
import UpdateToAttendee from '../pages/Admin/updateToAttendee.jsx';
import ApprovePendingEvents from '../pages/Admin/approvePendingEvents.jsx';
import ApprovePendingEventDetails from '../pages/Admin/ApprovePendingEventDetails.jsx';
import OrganizerProfile from '../pages/Admin/organizerProfile.jsx';
import ApprovedEvents from '../pages/Admin/approvedEvents.jsx';
import ApprovedEventDetails from '../pages/Admin/approvedEventDetails.jsx';
import CanceledEvents from '../pages/Admin/canceledEvents.jsx';
import CanceledEventDetails from '../pages/Admin/canceledEventDetails.jsx';
import CompletedEvents from '../pages/Admin/completedEvents.jsx';
import CompletedEventDetails from '../pages/Admin/completedEventDetails.jsx';
import OrganizersList from '../pages/Admin/organizersList.jsx';
import NotificationList from '../pages/Admin/notificationList.jsx';
import NotificationDetails from '../pages/Admin/notificationDetails.jsx';
import HomePage from '../pages/homePage.jsx';
import ProtectedRoute from '../components/ProtectedRoute';

function AdminPathRouter() {
  return (
    <Routes>
      {/* Public Routes */}

      {/* Protected Routes */}
      <Route path='/' element={<ProtectedRoute element={<HomePage />} />} />
      <Route path='add-artist' element={<ProtectedRoute element={<AddArtist />} />} />
      <Route path="messageOrganizer" element={<ProtectedRoute element={<MessageOrganizer />} />} />
      <Route path="update-to-attendees" element={<ProtectedRoute element={<UpdateToAttendee />} />} />
      <Route path='approve-pending-events' element={<ProtectedRoute element={<ApprovePendingEvents />} />} />
      <Route path='approve-pending-events/:eventId' element={<ProtectedRoute element={<ApprovePendingEventDetails />} />} />
      <Route path='approved-events/:eventId' element={<ProtectedRoute element={<ApprovedEventDetails />} />} />
      <Route path='approved-events' element={<ProtectedRoute element={<ApprovedEvents />} />} />
      <Route path='canceled-events' element={<ProtectedRoute element={<CanceledEvents />} />} />
      <Route path='canceled-events/:eventId' element={<ProtectedRoute element={<CanceledEventDetails />} />} />
      <Route path='completed-events' element={<ProtectedRoute element={<CompletedEvents />} />} />
      <Route path='completed-events/:eventId' element={<ProtectedRoute element={<CompletedEventDetails />} />} />
      <Route path='organizerProfile/:organizerId' element={<ProtectedRoute element={<OrganizerProfile />} />} />
      <Route path="list-organizers" element={<ProtectedRoute element={<OrganizersList />} />} />
      <Route path="notifications" element={<ProtectedRoute element={<NotificationList />} />} />
      <Route path="notification/:notificationId" element={<ProtectedRoute element={<NotificationDetails />} />} />
    </Routes>
  );
}

export default AdminPathRouter;
