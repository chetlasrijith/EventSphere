// src/components/EventList.jsx
import { useEffect, useState } from 'react';
import EventCard from '../components/ui/eventCard.jsx';
import EventCarousel from '../components/ui/eventCarousel.jsx';
import axios from 'axios';
const EventList = () => {
  const [events,setEvents] = useState([]);
  const fetchEvents =async ()=>{
    try{
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/home/events`,{
        withCredentials:true,
      });
      console.log(response);
      if(response.status === 200){
        setEvents(response.data);
      }
    }catch(err){
      console.log(err);
    }
  }
  useEffect(()=>{
    fetchEvents();
  },[]);
  return (
    <div>
      <div>
        <EventCarousel/>
      </div>
      <div className="event-list" style={{ marginTop: "5rem" }}>
        {Array.isArray(events)&&events.length !== 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <p>No events found</p>
        )}
      </div>
    </div>
  );

}
export default EventList;