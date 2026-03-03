import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Image, Badge, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import LoadingSpinner from "../../components/common/loadingSpinner";
import { FaCamera } from "react-icons/fa";
import { FaPlus, FaTrash , FaEnvelope, FaPhoneAlt, FaMapMarkerAlt,FaBriefcase,FaMedal,FaCalendarCheck } from "react-icons/fa";
// import imageCompression from 'browser-image-compression';
import OrganizerProfileUpdate from './organizerProfileUpdate'

import OrganizerExperience from "./organizerExperience";

import OrganizerAcheivments from "./organizerAcheivments";

const OrganizerProfile = () => {
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [formData, setFormData] = useState({}); // State for form inputs

  const apiBaseUrl = "http://localhost:8000";
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profileImg", file); 
  
      try {
        const response = await axios.put(`${apiBaseUrl}/api/organizer/updateProfileImage`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
  
        if (response.data.success) {
          setOrganizerData((prevData) => ({
            ...prevData,
            profileImg: response.data.profileImg, 
          }));
        }
      } catch (err) {
        setError("Failed to upload profile image. Try again.");
      }
    }
  };
  
  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("coverImage", file); 
  
      try {
        const response = await axios.put(`${apiBaseUrl}/api/organizer/updateCoverImage`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
  
        if (response.data.success) {
          setOrganizerData((prevData) => ({
            ...prevData,
            coverImage: response.data.coverImage, 
          }));
        }
      } catch (err) {
        setError("Failed to upload profile image. Try again.");
      }
    }
  };
  
  const fetchOrganizerProfile = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/organizer/profile`, {
        withCredentials: true,
      });
      setOrganizerData(response.data.user);
      setFormData({
        username: response.data.user?.username || "",
        about: response.data.user?.about || "",
        email: response.data.user?.email || "",
        mobileNumber: response.data.user?.mobileNumber || "",
        address: response.data.user?.address || "",
        profileImg:"",
        coverImage:"",
        experience:[],
        achievements:[],
      });
    } catch (err) {
      setError("Failed to load profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerProfile();
  }, []);

  const handleSave = async () => {
    try {
      const response = await axios.put(`${apiBaseUrl}/api/organizer/profile`, formData, {
        withCredentials: true,
      });
      console.log("Update Response:", response.data);
      setOrganizerData((prevData) => ({ ...prevData, ...formData }));
      setShowModal(false); // Close modal on success
    } catch (err) {
      console.error("Error updating organizer profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  };
  

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-danger">{error}</div>;

  const defaultProfileImg = "/images/sampleProfile.webp";
  const defaultCoverImg = "/images/banner.webp";

  return (
    <div
      style={{
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "#e0e0e0",
        paddingTop: "20px",
      }}
    >
      {/* Cover Image */}
      <div
  style={{
    backgroundImage: `url('${organizerData.coverImage || defaultCoverImg}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "250px",
    width: "80%",
    margin: "0 auto",
    position: "relative",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.7)",
    borderRadius: "10px",
    overflow: "hidden", // Ensures no elements spill out
  }}
>
  {/* Camera Icon for Upload */}
  <div
    style={{
      position: "absolute",
      bottom: "10px", // Adjusted padding for better placement
      right: "15px",
      background: "rgba(0, 0, 0, 0.6)",
      borderRadius: "50%",
      padding: "8px",
      cursor: "pointer",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10, // Ensures it is above the overlay
    }}
  >
    <label
      htmlFor="coverImageInput"
      style={{
        cursor: "pointer",
        margin: 0,
        pointerEvents: "auto", // Allow pointer events for the label
      }}
    >
      <FaCamera color="#fff" size={30} />
    </label>
    <input
      type="file"
      id="coverImageInput"
      accept="image/*"
      style={{ display: "none" }}
      onChange={handleCoverImageChange}
    />
  </div>

  {/* Overlay */}
  <div
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 5, // Below the camera icon
    }}
  ></div>
</div>

      <div style={{position:"relative",top:"5rem",right:"5rem"}}>
            <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              zIndex: 10,
              padding: "10px 20px",
              fontSize: "16px",
            }}
          >
            Update Profile
          </Button>
      </div>
      <Container>
      <Row className="justify-content-center">
  {/* Profile Image */}
  <Col
    md={4}
    className="text-center position-relative"
    style={{ marginTop: "-80px", zIndex: 100 }}
  >
    <div style={{ position: "relative", display: "inline-block" }}>
      <Image
        src={organizerData.profileImg || defaultProfileImg}
        roundedCircle
        style={{
          width: "150px",
          height: "150px",
          border: "5px solid #121212",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.8)",
          objectFit: "cover",
        }}
      />
      {/* Camera Icon Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "5px", // Closer to the image
          right: "10px",
          background: "rgba(0, 0, 0, 0.6)", // Transparent black background
          borderRadius: "50%",
          padding: "6px",
          cursor: "pointer",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <label htmlFor="profileImgInput" style={{ cursor: "pointer", margin: 0 }}>
          <FaCamera color="#fff" size={16} />
        </label>
        <input
          type="file"
          id="profileImgInput"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleProfileImageChange}
        />
      </div>
    </div>
    <h3 className="mt-3" style={{ fontWeight: "bold", color: "#ffffff" }}>
      {organizerData.username || "Unknown Organizer"}
    </h3>
    <Badge bg="info" className="mb-2" style={{ fontSize: "14px" }}>
      Event Organizer
    </Badge>
    <p style={{ color: "#b0b0b0", fontStyle: "italic" }}>
      {organizerData.about || "No description available."}
    </p>
  </Col>
</Row>




        {/* Contact Info */}
        <Row>
          <Col md={8} className="mx-auto">
           
<Card
  className="mb-4"
  style={{
    backgroundColor: "#1f1f1f",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.6)",
    color: "#e0e0e0",
  }}
>
  <Card.Body>
    <h4 className="text-info">Contact Information</h4>
    <p>
      <FaEnvelope className="text-warning me-2" />
      <strong>Email: </strong> {organizerData.email || "Not provided"}
    </p>
    <p>
      <FaPhoneAlt className="text-warning me-2" />
      <strong>Mobile: </strong> {organizerData.mobileNumber || "Not available"}
    </p>
    <p>
      <FaMapMarkerAlt className="text-warning me-2" />
      <strong>Address: </strong>
      {`${organizerData.address.street || "N/A"}, ${
        organizerData.address.city || "N/A"
      }, ${organizerData.address.state || "N/A"}, ${
        organizerData.address.postalCode || "N/A"
      }, ${organizerData.address.country || "N/A"}`}
    </p>
    <OrganizerExperience experience={organizerData.experience}/>
    <OrganizerAcheivments achievements={organizerData.acheivments}/>
            {/* Event Statistics */}
            <Card
              className="mb-4"
              style={{
                backgroundColor: "#292929",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.7)",
                color: "#e0e0e0",
              }}
            >
              <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaCalendarCheck className="text-warning me-2" size={24} />
                <h4 className="text-info mb-0">Event Statistics</h4>
              </div>
                <p>
                  <strong>Total Events Organized: </strong>
                  {organizerData.eventCount || 0}
                </p>
                <p>
                  <strong>Rating: </strong> {organizerData.rating || "N/A"} / 5
                </p>
              </Card.Body>
            </Card>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <OrganizerProfileUpdate 
        showModal={showModal} 
        setShowModal={setShowModal} 
        formData={formData} 
        setFormData={setFormData} 
        handleSave={handleSave} 
      />
    </div>
  );
};

export default OrganizerProfile;
