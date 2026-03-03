import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FiBell, FiSend } from "react-icons/fi";
import axios from "axios";

import { useNavigate } from "react-router-dom";

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OrganizerSendUpdatesPage = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {

      await axios.post(`${import.meta.env.VITE_BACKEND_SERVER}/api/organizer/update-to-attendee`, formData,{
        withCredentials:true
      });
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setFormData({ title: "", message: "" });
      }, 3000); // Reset form after 3 seconds
      if(response.status==200){
              toast("update sent to attendees successfully");
              Navigator("/");
              window.location.reload();
        }
    } catch (err) {
      setError("Failed to send your update. Please try again later.");
    }
  };

  return (
    <Container fluid className="py-5" style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0" style={{ backgroundColor: "#1e1e1e", color: "#f5f5f5" }}>
            <Card.Body>
              <h3 className="text-center mb-4" style={{ color: "#f5f5f5" }}>
                <FiBell className="me-2" /> Send Updates to Attendees
              </h3>
              <p className="text-center mb-4" style={{ color: "#d3d3d3", fontSize: "1rem" }}>
                Share important updates or notifications with your attendees easily.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: "#f5f5f5" }}>Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter update title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={50}
                    required
                    style={{ backgroundColor: "#2a2a2a", color: "#f5f5f5", border: "1px solid #444" }}
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: "#f5f5f5" }}>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Write your update here"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    style={{ backgroundColor: "#2a2a2a", color: "#f5f5f5", border: "1px solid #444" }}
                  />
                </Form.Group>
                <div className="text-center">
                  <Button
                    type="submit"
                    variant="primary"
                    className="d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "#007bff", borderColor: "#007bff", padding: "10px 20px", borderRadius: "30px" }}
                  >
                    <FiSend className="me-2" /> Send Update
                  </Button>
                </div>
              </Form>
              {submitted && (
                <div className="mt-4 alert alert-success text-center" style={{ backgroundColor: "#1e1e1e", color: "#4caf50" }}>
                  Your update has been successfully sent to the attendees!
                </div>
              )}
              {error && (
                <div className="mt-4 alert alert-danger text-center" style={{ backgroundColor: "#1e1e1e", color: "#f44336" }}>
                  {error}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrganizerSendUpdatesPage;
