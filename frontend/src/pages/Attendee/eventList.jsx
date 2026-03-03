import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const sampleEvents = [
    {
        id: 1,
        eventname: "Tech Conference 2025",
        category: "Technology",
        startDate: "2025-02-15",
        endDate: "2025-02-17",
        venue: "Tech Arena, Silicon Valley",
        banner: "/images/banner.webp",
        status: "approved",
    },
    {
        id: 2,
        eventname: "Art Gala Night",
        category: "Art & Culture",
        startDate: "2025-03-10",
        endDate: "2025-03-10",
        venue: "Downtown Art Gallery, New York",
        banner: "/images/banner.webp",
        status: "approved",
    },
    {
        id: 3,
        eventname: "Startup Meetup",
        category: "Business",
        startDate: "2025-04-01",
        endDate: "2025-04-02",
        venue: "Innovators Hub, Seattle",
        banner: "/images/banner.webp",
        status: "pending",
    },
];

const EventList = () => {
    const navigate = useNavigate();

    const handleCardClick = (eventId) => {
        navigate(/attendee/events/temp);
    };

    return (
        <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
            <Container>
                <h1 className="text-center mb-4">My Organized Events</h1>
                <Row className="gy-4">
                    {sampleEvents.map((event) => (
                        <Col md={6} lg={4} key={event.id}>
                            {event.status === "approved" && (
                                <Card 
                                    className="bg-dark text-light border-0 shadow-sm" 
                                    onClick={() => handleCardClick(event.id)} 
                                    style={{ cursor: "pointer" }}
                                >
                                    <Card.Img
                                        variant="top"
                                        src={event.banner}
                                        alt={event.eventname}
                                        style={{ height: "180px", objectFit: "cover" }}
                                    />
                                    <Card.Body>
                                        <Card.Title className="mb-2" style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                                            {event.eventname}
                                        </Card.Title>
                                        <Card.Text className="mb-3">
                                            <div><strong>Category:</strong> {event.category}</div>
                                            <div><strong>Venue:</strong> {event.venue}</div>
                                            <div><strong>Dates:</strong> {event.startDate} - {event.endDate}</div>
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
};

export default EventList;