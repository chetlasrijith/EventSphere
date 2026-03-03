import React, { useState ,useEffect} from "react";
import axios from "axios";
import { Form, Button, Container, Row, Col, InputGroup } from "react-bootstrap";
import { FaUser, FaMusic, FaAlignLeft, FaGlobe, FaInstagram, FaTwitter, FaCalendar } from "react-icons/fa";
import "./addArtist.css";
import {useNavigate} from 'react-router-dom'

const ArtistForm = () => {
  const navigate = new useNavigate();
  const [formData, setFormData] = useState({
    artistName: "",
    genre: "",
    bio: "",
    birthdate: "",
    socialLinks: {
      website: "",
      instagram: "",
      twitter: "",
    },
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value,
      },
    }));
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.artistName) errors.artistName = "Artist name is required.";
    if (!formData.genre) errors.genre = "Genre is required.";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      setLoading(true);
  
      console.log("Raw formData before conversion:", formData); 
  
      // Convert to FormData
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData[key] !== undefined && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      }
      const formDataObject = {};
        formDataToSend.forEach((value, key) => {
        formDataObject[key] = value;
      });
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_SERVER}/api/admin/add-artist`,
        formDataObject,
        { withCredentials: true } // Let Axios handle headers
      );
  
      setSuccessMessage("Artist added successfully!");
      if (response.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.error("Error adding artist:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <Container className="artist-form-container">
      <h2 className="text-center mb-4 " >Add Artist</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-lg bg-dark text-light">
        
        {/* Artist Name */}
        <Form.Group className="mb-3">
          <Form.Label><FaUser className="icon" /> Artist Name</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              name="artistName"
              placeholder="Enter artist name"
              value={formData.artistName}
              onChange={handleChange}
              isInvalid={!!errors.artistName}
            />
          </InputGroup>
          <Form.Control.Feedback type="invalid">{errors.artistName}</Form.Control.Feedback>
        </Form.Group>

        {/* Genre */}
        <Form.Group className="mb-3">
          <Form.Label><FaMusic className="icon" /> Genre</Form.Label>
          <Form.Control
            type="text"
            name="genre"
            placeholder="Enter genre"
            value={formData.genre}
            onChange={handleChange}
            isInvalid={!!errors.genre}
          />
          <Form.Control.Feedback type="invalid">{errors.genre}</Form.Control.Feedback>
        </Form.Group>

        {/* Bio */}
        <Form.Group className="mb-3">
          <Form.Label><FaAlignLeft className="icon" /> Bio</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="bio"
            placeholder="Enter bio"
            value={formData.bio}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Birth Date */}
        <Form.Group className="mb-3">
          <Form.Label><FaCalendar className="icon" /> Birth Date</Form.Label>
          <Form.Control
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Social Links */}
        <Row>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label><FaGlobe className="icon" /> Website</Form.Label>
              <Form.Control type="text" name="website" placeholder="Website URL" value={formData.socialLinks.website} onChange={handleSocialChange} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label><FaInstagram className="icon" /> Instagram</Form.Label>
              <Form.Control type="text" name="instagram" placeholder="Instagram URL" value={formData.socialLinks.instagram} onChange={handleSocialChange} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label><FaTwitter className="icon" /> Twitter</Form.Label>
              <Form.Control type="text" name="twitter" placeholder="Twitter URL" value={formData.socialLinks.twitter} onChange={handleSocialChange} />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
          {loading ? "Adding..." : "Add Artist"}
        </Button>
      </Form>
    </Container>
  );
};

export default ArtistForm;
