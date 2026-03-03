import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Badge,
  Button,
} from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaRupeeSign,
  FaMicrophone,
  FaBuilding,
  FaConciergeBell,
} from "react-icons/fa";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const AdminEventDetails = () => {
  const [event, setEvent] = useState(null);
  const apiBaseUrl = "http://localhost:8000";
  const { eventId } = useParams();
  const navigate = useNavigate();

  const getEvent = async () => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/admin/getEvent/${eventId}`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setEvent(response.data);
      }
    } catch (e) {
      console.log(`Error occurred - ${e.message}`);
    }
  };

  useEffect(() => {
    getEvent();
  }, []);

  if (!event) return <div>Loading...</div>;

  return (
    <div
      style={{
        backgroundColor: "#1e1e1e",
        color: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      <Container>
        <Card className="bg-dark text-light border-0 shadow-lg mb-4">
          <Card.Img
            variant="top"
            src={event?.banner || "/images/banner.webp"}
            alt={event?.eventname || "Event Banner"}
            style={{
              maxHeight: "400px",
              objectFit: "cover",
              borderBottom: "4px solid #00bcd4",
            }}
          />
          <Card.ImgOverlay
            className="d-flex flex-column justify-content-center text-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          >
            <h1 style={{ fontWeight: "bold", fontSize: "2.75rem" }}>
              {event.eventname}
            </h1>
            <p>
              <Badge bg="primary" className="me-2">
                {event.category}
              </Badge>
                        {event.status === "approved" ? (
            <Badge bg="success">Approved</Badge>
          ) : event.status === "pending" ? (
            <Badge bg="warning">Pending</Badge>
          ) : event.status === "canceled" ? (
            <Badge bg="danger">Canceled</Badge>
          ) : event.status === "completed" ? (
            <Badge bg="primary">Completed</Badge>
          ) : null}

            </p>
          </Card.ImgOverlay>
        </Card>

        <div className="text-center mb-4">
          <Button
            variant="info"
            className="me-2"
            onClick={() => navigate(`/admin/organizerProfile/${event.organizer}`)}
          >
            View Organizer Profile
          </Button>
        </div>

        <Row className="gy-4">
          <Col md={8}>
            <Card className="bg-dark text-light border-0 shadow-sm mb-4">
              <Card.Body>
                <h4 className="text-info mb-4">Event Details</h4>
                <ListGroup variant="flush" className="bg-dark">
                  <ListGroup.Item className="bg-dark text-light border-0">
                    <FaCalendarAlt className="me-2 text-primary" />
                    <strong>Dates:</strong>{" "}
                    {new Date(event.startDate).toLocaleDateString("en-GB")} -{" "}
                    {new Date(event.endDate).toLocaleDateString("en-GB")}
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-dark text-light border-0">
                    <FaMapMarkerAlt className="me-2 text-warning" />
                    <strong>Venue:</strong> {event.venue}
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-dark text-light border-0">
                    <FaBuilding className="me-2 text-secondary" />
                    <strong>Address:</strong> <br />
                    {`${event.address.street}, ${event.address.city}, ${event.address.state}`}{" "}
                    <br />
                    {`${event.address.postalCode}, ${event.address.country}`}
                  </ListGroup.Item>
                </ListGroup>
                <ListGroup.Item className="bg-dark text-light border-0">
                  <FaUsers className="me-2 text-info" />
                  <strong>Max Attendees:</strong> {event.maxAttendees}
                </ListGroup.Item>
                <ListGroup.Item className="bg-dark text-light border-0">
                  <FaUsers className="me-2 text-info" />
                  <strong>Current Attendees:</strong> {event.currentAttendees}
                </ListGroup.Item>
              </Card.Body>
            </Card>
            <Card className="bg-dark text-light border-0 shadow-sm">
                          <Card.Body>
                            <h4 className="text-info mb-4">Additional Information</h4>
                            <Row>
                              <Col md={6}>
                                <h5 className="text-primary"><FaMicrophone className="me-2" />Speakers</h5>
                                <ul className="ms-3">
                                  {event.speakers}
                                </ul>
                              </Col>
                              <Col md={6}>
                                <h5 className="text-primary"><FaConciergeBell className="me-2" />Services</h5>
                                <ul className="ms-3">
                                  {event.services}
                                </ul>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
            
                      {/* Right Column */}
                      <Col md={4}>
                        {/* Ticket Information */}
                        <Card className="bg-dark text-light border-0 shadow-sm mb-4">
                          <Card.Body>
                            <h4 className="text-info">Ticket Information</h4>
                            <ListGroup variant="flush" className="bg-dark">
                              <ListGroup.Item className="bg-dark text-light border-0">
                                <strong>Tickets Required:</strong>{" "}
                                {event.ticketsRequired ? (
                                  <span className="text-success">Yes</span>
                                ) : (
                                  <span className="text-danger">No</span>
                                )}
                              </ListGroup.Item>
                              {event.ticketsRequired && (
                                <ListGroup.Item className="bg-dark text-light border-0">
                                  <FaRupeeSign className="me-2 text-success" />
                                  <strong>Price:</strong> {event.price}
                                </ListGroup.Item>
                              )}
                            </ListGroup>
                          </Card.Body>
                        </Card>
            
                        {/* Sponsors */}
                        <Card className="bg-dark text-light border-0 shadow-sm">
                          <Card.Body>
                            <h4 className="text-info"><FaBuilding className="me-2" />Sponsors</h4>
                            <ul className="ms-3">
                              {event.sponsers}
                            </ul>
                          </Card.Body>
                        </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminEventDetails;
