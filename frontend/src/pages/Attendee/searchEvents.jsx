import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const SearchEvent = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const location = useLocation();
    
    useEffect(() => {
        if (location.state?.searchEvents) {
            setEvents(location.state.searchEvents);
        }
    }, [location.state?.searchEvents]);


    const handleCardClick = (eventId) => {
        navigate(`/attendee/events/${eventId}`);
    };

     const approvedEvents = events;//.filter(event => event.status === "approved");


    return (
        <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
            <Container>
                <h1 className="text-center mb-4">Events Available</h1>
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
                                            <div><strong>Dates:</strong> {event.startDate} - {event.endDate}</div>
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

export default SearchEvent;
