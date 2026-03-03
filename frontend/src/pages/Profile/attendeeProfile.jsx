import React, { useEffect, useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [formData,setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
  }, [user]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profileImg", file); 
  
      try {
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/profileImageUpdate`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
  
        if (response.data.success) {
          setUser((prevData) => ({
            ...prevData,
            profileImg: response.data.profileImg, 
          }));
        }
      } catch (err) {
        setError("Failed to upload profile image. Try again.");
      }
    }
  };
  

  const saveChanges = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/profileupdate`,
        editedUser,
        { withCredentials: true }
      );
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const getUser = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/profile`,
        { withCredentials: true }
      );
      setUser(response.data.user);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="d-flex justify-content-center align-items-center vh-100 dark-bg">
        <Card className="profile-card text-light">
          <Card.Body>
            <div className="text-center position-relative">
              <img
                src={editedUser?.profileImg || "/images/sampleProfile.webp"}
                alt="Profile"
                className="profile-img"
              />
              <label htmlFor="imageUpload" className="camera-icon text-light">
                <FaCamera />
              </label>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                className="d-none"
                onChange={handleImageChange}
              />
            </div>
            <h4 className="text-center mt-2">Profile</h4>
            <hr />
            {isEditing ? (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={editedUser?.username || ""}
                    onChange={handleEditChange}
                    className="dark-input"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editedUser?.email || ""}
                    onChange={handleEditChange}
                    className="dark-input"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    name="mobileNumber"
                    value={editedUser?.mobileNumber || ""}
                    onChange={handleEditChange}
                    className="dark-input"
                  />
                </Form.Group>
                <div className="d-flex justify-content-between">
                  <Button variant="success" onClick={saveChanges}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>Name:</strong> {user?.username}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Mobile:</strong> {user?.mobileNumber}
                </p>
                <div className="d-flex justify-content-between">
                  <Button variant="warning" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => navigate("/")}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
      <style>{`
        body {
          background-color: #121212;
          color: #fff;
        }
        .dark-bg {
          background-color: #121212;
        }
        .profile-card {
          width: 350px;
          background: #1e1e1e;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
        }
        .profile-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #444;
        }
        .camera-icon {
          position: absolute;
          bottom: 0;
          right: 35%;
          background: #333;
          padding: 5px;
          border-radius: 50%;
          cursor: pointer;
        }
        .camera-icon:hover {
          background: #444;
        }
        .dark-input {
          background-color: #2c2c2c;
          border: 1px solid #444;
          color: #fff;
        }
        .dark-input:focus {
          background-color: #333;
          color: #fff;
          border-color: #555;
          box-shadow: none;
        }
        .text-light {
          color: #fff;
        }
        .btn-warning {
          background-color: #ffc107;
          border: none;
        }
        .btn-danger {
          background-color: #dc3545;
          border: none;
        }
        .btn-success {
          background-color: #28a745;
          border: none;
        }
        .btn-secondary {
          background-color: #6c757d;
          border: none;
        }
      `}</style>
    </>
  );
}

export default ProfilePage;
