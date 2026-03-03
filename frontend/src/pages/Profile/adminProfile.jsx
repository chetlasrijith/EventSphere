import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminProfile.css";

const AdminProfile = ({ onClose }) => {
  const [adminData, setAdminData] = useState({
    username: "",
    role: "",
    profileImage: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "" });

  const getAdminDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/admin/getMe`, {
        withCredentials: true,
      });
      setAdminData(response.data);
      setFormData({ username: response.data.username });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAdminDetails();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_SERVER}/api/admin/update-profile`, formData, {
        withCredentials: true,
      });

      setAdminData((prev) => ({ ...prev, username: formData.username }));
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <button className="close-btn" onClick={onClose}>✖</button>

        {/* Profile Image */}
        {adminData.profileImage ? (
          <img src={adminData.profileImage} alt="Profile" className="profile-img" />
        ) : (
          <div className="profile-img default">👤</div>
        )}

        {/* Editable Profile Name */}
        {isEditing ? (
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="profile-input"
          />
        ) : (
          <h2 className="profile-name">{adminData.username}</h2>
        )}

        <p className="profile-role">{adminData.role}</p>

        {/* Edit/Save Buttons */}
        {isEditing ? (
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
        ) : (
          <button className="update-btn" onClick={() => setIsEditing(true)}>Update Profile</button>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;
