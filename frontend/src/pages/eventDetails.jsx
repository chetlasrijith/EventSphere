import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, ListGroup, Badge, Button } from "react-bootstrap";
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaDollarSign, FaMicrophone, FaBuilding, FaConciergeBell } from "react-icons/fa";
import axios from "axios";
import { isAuthenticated } from "../utils/auth.js";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
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
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/home/eventDetails/${eventId}`,{
                    withCredentials:true,
                });
                setEvent(response.data);
                setIsRegistered(response.data.isRegistered); // Assuming API returns this
            } catch (err) {
                setError("Failed to fetch event details");
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleRegister = async () => {
        const decodedToken = isAuthenticated();
        if (decodedToken == null || decodedToken.role !== "Attendee") {
            toast.warning("Please login as an attendee");
            return; // Exit the function since the condition is not met
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/events/${eventId}/register`,{},{
                withCredentials: true
            });
            toast.success("You have successfully registered");
            setIsRegistered(true); // Update state after successful registration
            navigate(`/attendee/events/register/ticket`, { state: { event: response.data.eventDetails } });
        } catch (err) {
            toast.warning(err.message);
        }
    };
    

    if (loading) return <p>Loading event details...</p>;
    if (error) return <p>{error}</p>;
    if (!event) return <p>No event found.</p>;

    return (
        <div style={{ backgroundColor: "#1e1e1e", color: "#F8FAFC", minHeight: "100vh" }}>
            <Container>
                <Card className="bg-dark text-light border-0 shadow-lg mb-4">
                    <Card.Img variant="top" src={event.banner || '/images/banner.webp'} alt={event.eventname} style={{ maxHeight: "400px", objectFit: "cover", borderBottom: "4px solid #00bcd4" }} />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-center text-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
                        <h1 style={{ fontWeight: "bold", fontSize: "2.75rem" }}>{event.eventname}</h1>
                        <p><Badge bg="primary" className="me-2">{event.category}</Badge></p>
                    </Card.ImgOverlay>
                </Card>

                <Row className="gy-4">
                    <Col md={8}>
                        <Card className="bg-dark text-light border-0 shadow-sm mb-4">
                            <Card.Body>
                                <h4 className="text-info mb-4">Event Details</h4>
                                <ListGroup variant="flush" className="bg-dark">
                                <ListGroup.Item className="bg-dark text-light border-0">
                                <FaCalendarAlt className="me-2 text-primary" />
                                <strong>Dates:</strong> {getFormattedDate(event.startDate)} - {getFormattedDate(event.endDate)}
                                </ListGroup.Item>
                                    <ListGroup.Item className="bg-dark text-light border-0"><FaMapMarkerAlt className="me-2 text-warning" /><strong>Venue:</strong> {event.venue}</ListGroup.Item>
                                    <ListGroup.Item className="bg-dark text-light border-0"><FaUsers className="me-2 text-info" /><strong>Max Attendees:</strong> {event.maxAttendees}</ListGroup.Item>
                                    <ListGroup.Item className="bg-dark text-light border-0"><FaUsers className="me-2 text-info" /><strong>Current Attendees:</strong> {event.currentAttendees}</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>

                        <Card className="bg-dark text-light border-0 shadow-sm">
                            <Card.Body>
                                <h4 className="text-info mb-4">Additional Information</h4>
                                <Row>
                                    <Col md={6}>
                                        <h5 className="text-primary"><FaMicrophone className="me-2" />Speakers</h5>
                                        <ul>{event.speakers}</ul>
                                    </Col>
                                    <Col md={6}>
                                        <h5 className="text-primary"><FaConciergeBell className="me-2" />Services</h5>
                                        <ul>{event.services}</ul>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <div className="text-center mb-4">
                            {!isRegistered ? (
                                <Button variant="success" size="lg" onClick={handleRegister}>Register Now</Button>
                            ) : (
                                <Button variant="secondary" size="lg" disabled>Already Registered</Button>
                            )}
                        </div>

                        <Card className="bg-dark text-light border-0 shadow-sm mb-4">
                            <Card.Body>
                                <h4 className="text-info">Ticket Information</h4>
                                <ListGroup variant="flush" className="bg-dark">
                                    <ListGroup.Item className="bg-dark text-light border-0"><strong>Tickets Required:</strong> {event.ticketsRequired ? <span className="text-success">Yes</span> : <span className="text-danger">No</span>}</ListGroup.Item>
                                    {event.ticketsRequired && <ListGroup.Item className="bg-dark text-light border-0"><FaDollarSign className="me-2 text-success" /><strong>Price:</strong> ${event.price}</ListGroup.Item>}
                                </ListGroup>
                            </Card.Body>
                        </Card>

                        <Card className="bg-dark text-light border-0 shadow-sm">
                            <Card.Body>
                                <h4 className="text-info"><FaBuilding className="me-2" />Sponsors</h4>
                                <ul>{event.sponsors}</ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default EventDetails;
