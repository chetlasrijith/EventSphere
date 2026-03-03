import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useInView } from "react-intersection-observer";

const EventList = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { ref, inView } = useInView({ threshold: 0.5 });

    const apiBaseUrl = "http://localhost:8000";
    
    const fetchEvents = useCallback(async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/admin/approved-events`, {
                params: { page, limit: 10 },
                withCredentials: true,
            });
            
            setEvents((prevEvents) => {
                const eventSet = new Set(prevEvents.map(e => e._id));
                const newEvents = response.data.events.filter(e => !eventSet.has(e._id));
                return [...prevEvents, ...newEvents];
            });
            setHasMore(response.data.events.length > 0);
        } catch (err) {
            console.error(err);
        }
    }, [page]);

    useEffect(() => {
        if (inView && hasMore) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [inView, hasMore]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleViewDetails = (eventId) => {
        navigate(`${eventId}`);
    };

    return (
        <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
            <Container>
                <h1 className="text-center mb-4">Pending Approval Events</h1>
                <Row className="gy-4">
                    {events.map((event) => (
                        <Col md={6} lg={4} key={event._id}>
                            <Card className="bg-dark text-light border-0 shadow-sm">
                                <Card.Img variant="top" src={event?.banner || "/images/banner.webp"} alt={event.eventname} style={{ height: "180px", objectFit: "cover" }} />
                                <Card.Body>
                                    <Card.Title className="mb-2" style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                                        {event.eventname}
                                    </Card.Title>
                                    <Card.Text className="mb-3">
                                        <div><strong>Category:</strong> {event.category}</div>
                                        <div><strong>Venue:</strong> {event.venue}</div>
                                        <div><strong>Dates:</strong> {new Date(event.startDate).toLocaleDateString('en-GB')} - {new Date(event.endDate).toLocaleDateString('en-GB')}</div>
                                        <div><strong>Status:</strong> <span className="text-success">Approved</span></div>
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
                {hasMore && <div ref={ref} style={{ textAlign: "center", padding: "20px" }}>Loading more events...</div>}
            </Container>
        </div>
    );
};

export default EventList;
