import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/protectedRoute';
import HomePage from '../pages/homePage';
import EventDetails from '../pages/eventDetails';
import Ticket from '../pages/Attendee/ticket';
import SearchEvents from '../pages/Attendee/searchEvents';
import MyEventList from '../pages/Attendee/myEventList';
import MyTickets from '../pages/Attendee/myTickets';
import AttendeeProfile from '../pages/Profile/attendeeProfile';
import NotificationList from '../pages/Attendee/notificationList';

const attendee = (element) => <ProtectedRoute element={element} roles={['Attendee']} />;

export default function AttendeePathRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="profile" element={attendee(<AttendeeProfile />)} />
      <Route path="myevent-list" element={attendee(<MyEventList />)} />
      <Route path="my-tickets" element={attendee(<MyTickets />)} />
      <Route path="search-events" element={attendee(<SearchEvents />)} />
      <Route path="events/:id" element={attendee(<EventDetails />)} />
      <Route path="events/register/ticket" element={attendee(<Ticket />)} />
      <Route path="notifications" element={attendee(<NotificationList />)} />
    </Routes>
  );
}