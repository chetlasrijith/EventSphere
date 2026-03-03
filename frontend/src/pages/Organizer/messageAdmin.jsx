import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OrganizerQueryPage = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({
    subject: "",
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

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER}/api/organizer/messageAdmin`, formData,{
        withCredentials:true
      });
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setFormData({ subject: "", message: "" });
      }, 3000); // Reset form after 3 seconds
      if(response.status==200){
        toast.success("message sent to admin successfully");
        Navigator("/");
      }
    } catch (err) {
      setError("Failed to submit your message. Please try again later.");
    }
  };

  return (
    <Container fluid className="py-5" style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0" style={{ backgroundColor: "#1e1e1e", color: "#f5f5f5" }}>
            <Card.Body>
              <h3 className="text-center mb-4" style={{ color: "#f5f5f5" }}>
                <FiMessageCircle className="me-2" /> Organizer Queries & Suggestions
              </h3>
              <p className="text-center mb-4" style={{ color: "#d3d3d3", fontSize: "1rem" }}>
                Have any questions or suggestions about your event? Share them with the admin team!
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: "#f5f5f5" }}>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    maxLength={50}
                    required
                    style={{ backgroundColor: "#2a2a2a", color: "#f5f5f5", border: "1px solid #444" }}
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: "#f5f5f5" }}>Your Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Write your message here"
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
                    <FiSend className="me-2" /> Submit
                  </Button>
                </div>
              </Form>
              {submitted && (
                <div className="mt-4 alert alert-success text-center" style={{ backgroundColor: "#1e1e1e", color: "#4caf50" }}>
                  Your message has been successfully sent to the admin!
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

export default OrganizerQueryPage;
