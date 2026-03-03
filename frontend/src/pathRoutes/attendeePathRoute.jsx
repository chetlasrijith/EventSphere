import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/homePage.jsx';
import EventDetails from '../pages/Attendee/eventDetails.jsx';
import AttendeeTicket from '../pages/Attendee/ticket.jsx';
import SearchEvents from '../pages/Attendee/searchEvents.jsx';
import MyEventList from '../pages/Attendee/myEventList.jsx'
import AttendeeProfile from '../pages/profile/attendeeProfile.jsx';
import NotificationList from '../pages/Attendee/notificationList.jsx';
import NotificationDetails from '../pages/Attendee/notificationDetails.jsx';

function attendeePathRoute(){
    return (
          <Routes>
            <Route path='/'  element={<HomePage />} />
            <Route path="profile" element={<AttendeeProfile/>}/>
            <Route path="/" element={<HomePage/>}/>
            <Route path="myevent-list" element={<MyEventList/>}/>
            <Route path="search-events" element={<SearchEvents/>}/>
            <Route path="events/:id" element={<EventDetails/>}/>
            <Route path="events/register/ticket" element={<AttendeeTicket />} />
            <Route path='notifications' element={<NotificationList/>}/>
            <Route path='notification/:notificationId' element={<NotificationDetails/>}/>
          </Routes>
      );
}
export default attendeePathRoute;