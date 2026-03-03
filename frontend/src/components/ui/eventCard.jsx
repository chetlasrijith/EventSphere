// src/components/EventCard.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import '../../styles/homePageStyle.css'

const EventCard = ({ event }) => {
  const navigate = useNavigate();  // Initialize navigate

  const handleMoreDetails = () => {
    navigate(`/eventDetails/${event.id}`);  // Navigate to event details page
  };

  return (
    <div className="event-card">
      <div className="event-banner">
        <img src={event.banner} alt={event.title} />
        <span className="event-category">{event.category}</span>
      </div>
      <div className="event-info">
        <h2 className="event-title">{event.title}</h2>
        <p className="event-date">
          <FontAwesomeIcon icon={faCalendarAlt} /> {event.date}
        </p>
        <p className="event-location">
          <FontAwesomeIcon icon={faMapMarkerAlt} /> {event.location}
        </p>
        <p className="event-description">{event.description}</p>
        <button className="event-button" onClick={handleMoreDetails}>
          More Details
        </button>
      </div>
    </div>
  );
};

export default EventCard;
