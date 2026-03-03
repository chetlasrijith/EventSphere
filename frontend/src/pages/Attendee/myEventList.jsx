import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EventList = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const getFormattedDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const suffix = (day) => {
          if (day > 3 && day < 21) return 'th';
          switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
          }
        };
        const month = date.toLocaleString('en-GB', { month: 'long' });
        const year = date.getFullYear();
        return `${day}${suffix(day)} ${month} ${year}`;
      };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                console.log("Hello")
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/myevent-list`, {
                    withCredentials: true,
                });
                console.log(response)
                console.log("Fetched Events:", response.data.events?.length || response.data.length);
                
                setEvents(response.data.events || response.data);
            } catch (err) {
                console.error("Failed to fetch event details:", err);
                setError("Failed to fetch events. Please try again later.");
            }
        };
        fetchEvent();
    }, []);

    const handleCardClick = (eventId) => {
        navigate(`/attendee/events/${eventId}`);
    };

     const approvedEvents = events;//.filter(event => event.status === "approved");


    return (
        <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
            <Container>
                <h1 className="text-center mb-4">Events Available</h1>
                {error && <p className="text-danger text-center">{error}</p>}
                <Row className="gy-4">
                    {approvedEvents.length > 0 ? (
                        approvedEvents.map((event) => (
                            <Col md={6} lg={4} key={event._id}>
                                <Card 
                                    className="bg-dark text-light border-0 shadow-sm" 
                                    onClick={() => handleCardClick(event._id)} 
                                    style={{ cursor: "pointer" }}
                                >
                                    <Card.Img
                                        variant="top"
                                        src={event.banner || "/images/banner.webp"} 
                                        alt={event.eventname}
                                        style={{ height: "180px", objectFit: "cover" }}
                                    />
                                    <Card.Body>
                                        <Card.Title className="mb-2" style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                                            {event.eventname}
                                        </Card.Title>
                                        <Card.Text className="mb-3">
                                            <div><strong>Category:</strong> {event.category || "N/A"}</div>
                                            <div><strong>Venue:</strong> {event.venue || "TBA"}</div>
                                            <div>
                                                <strong>Dates:</strong> {getFormattedDate(event.startDate)} - {getFormattedDate(event.endDate)}
                                            </div>
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <p className="text-center">
                            {events.length === 0 ? "Loading events..." : "No approved events found."}
                        </p>
                    )}
                </Row>
            </Container>
        </div>
    );
};

export default EventList;
