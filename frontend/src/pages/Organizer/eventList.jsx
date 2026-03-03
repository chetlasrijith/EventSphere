import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const EventList = () => {
    const navigate = useNavigate();
    const [events,setEvents] = useState([]);
    const handleViewDetails = (eventId) => {
        navigate(`${eventId}`);
      };
      const apiBaseUrl = "http://localhost:8000";
const fetchEvents = async()=>{
    try{
      const response = await axios.get(`${apiBaseUrl}/api/organizer/events`, {
        withCredentials: true,
      });
      setEvents(response.data.events);
    }catch(err){
        console.error(err);
    }
}
useEffect(()=>{
fetchEvents();
},[])
  return (
    <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
      <Container>
        <h1 className="text-center mb-4">My Organized Events</h1>
        <Row className="gy-4">
          {events!=null&&events.map((event) => (
            <Col md={6} lg={4} key={event.id}>
              <Card className="bg-dark text-light border-0 shadow-sm">
                <Card.Img variant="top" src={event?.banner||"/images/banner.webp"} alt={event.eventname} style={{ height: "180px", objectFit: "cover" }} />
                <Card.Body>
                  <Card.Title className="mb-2" style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    {event.eventname}
                  </Card.Title>
                  <Card.Text className="mb-3">
                    <div><strong>Category:</strong> {event.category}</div>
                    <div><strong>Venue:</strong> {event.venue}</div>
                    <div><strong>Dates:</strong> {new Date(event.startDate).toLocaleDateString('en-GB')} - {new Date(event.endDate).toLocaleDateString('en-GB')}</div>
                    <div><strong>Status:</strong> <span className={event.status === "approved" ? "text-success" : "text-warning"}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span></div>
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-20"
                    onClick={() => handleViewDetails(event._id)}
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default EventList;