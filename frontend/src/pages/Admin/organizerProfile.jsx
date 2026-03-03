import React, { useEffect, useState } from "react";
import { Container, Card, ListGroup } from "react-bootstrap";
import axios from "axios";
import { useParams } from "react-router-dom";
import { MdEmail, MdPhone, MdLocationOn, MdWork, MdEmojiEvents } from "react-icons/md";
const OrganizerProfile = () => {
  const [organizerData, setOrganizerData] = useState(null);
  const { organizerId } = useParams();

  const getOrganizer = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/admin/getOrganizer/${organizerId}`, {
        withCredentials: true,
      });
      console.log(response);
      if (response.status === 200) {
        setOrganizerData(response.data);
      }
    } catch (e) {
      console.log(`Error fetching organizer - ${e.message}`);
    }
  };

  useEffect(() => {
    getOrganizer();
  }, []);

  if (!organizerData) return <div>Loading...</div>;

  return (
    <div style={{ backgroundColor: "#1e1e1e", color: "#F8FAFC", minHeight: "100vh" }}>
    <Container>
      <Card className="bg-dark text-light border-0 shadow-lg mb-4">
        <Card.Img
          variant="top"
          src={organizerData.coverImage || "/images/banner.webp"}
          alt="Cover Image"
          style={{ maxHeight: "300px", objectFit: "cover" }}
        />
        <Card.Body className="text-center">
          <img
            src={organizerData.profileImg || "/images/sampleProfile.webp"}
            alt="Profile"
            className="rounded-circle mb-3"
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
          <h4 className="text-info mb-1">{organizerData.username}</h4>
          <p className="text-secondary small">{organizerData.about}</p>
        </Card.Body>
      </Card>
  
      {/* Contact Information */}
      <Card className="bg-dark text-light border-0 shadow-lg mb-4">
        <Card.Body>
          <h5><MdEmail /> Contact Information</h5>
          <ListGroup variant="flush" className="bg-dark">
            <ListGroup.Item className="bg-dark text-light border-0">
              <MdEmail /> <strong>Email:</strong> {organizerData.email}
            </ListGroup.Item>
            <ListGroup.Item className="bg-dark text-light border-0">
              <MdPhone /> <strong>Mobile:</strong> {organizerData.mobileNumber || "Not provided"}
            </ListGroup.Item>
            <ListGroup.Item className="bg-dark text-light border-0">
              <MdLocationOn /> <strong>Address:</strong> {organizerData.address.street}, {organizerData.address.city}, {organizerData.address.state}, {organizerData.address.postalCode}, {organizerData.address.country}
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
  
      {/* Experience */}
      <Card className="bg-dark text-light border-0 shadow-lg mb-4">
        <Card.Body>
          <h5><MdWork /> Experience</h5>
          {organizerData.experience && organizerData.experience.length > 0 ? (
            <ul>
              {organizerData.experience.map((exp, index) => (
                <li key={index}>{exp.organization} - {exp.duration.years} years {exp.duration.months} months</li>
              ))}
            </ul>
          ) : (
            <p>No experience</p>
          )}
        </Card.Body>
      </Card>
  
      {/* Achievements */}
      <Card className="bg-dark text-light border-0 shadow-lg mb-4">
        <Card.Body>
          <h5><MdEmojiEvents /> Achievements</h5>
          {organizerData.achievements && organizerData.achievements.length > 0 ? (
            <ul>
              {organizerData.achievements.map((ach, index) => (
                <li key={index}>{ach}</li>
              ))}
            </ul>
          ) : (
            <p>No achievements</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  </div>
  
  );
};

export default OrganizerProfile;
