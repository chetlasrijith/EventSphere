// AdminSignupForm.js
import React, { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

const AdminSignupForm = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobileNumber:"",
    password: "",
    role: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (type === "checkbox") {
      setFormData({
        ...formData,
        role: checked ? value : "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  

  const validateForm = () => {
    let errors = {};
    if (!formData.username) errors.username = "userame is required.";
    if (!formData.email) errors.email = "Email is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (!formData.role) errors.role = "Role selection is required.";
    if(!formData.mobileNumber) errors.mobileNumber="MobileNumber section is required";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER}/api/auth/admin/signup`, formData); // Replace with your backend endpoint
      if(response.status==200){
        toast.success("Signup successful!");
        setSuccessMessage("Signup successful!");
        Navigator("/");
        window.location.reload();
      }
      setErrorMessage("");
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message || "Something went wrong during signup."
      );
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: darkMode ? "#121212" : "#f8f9fa",
        color: darkMode ? "#f8f9fa" : "#212529",
      }}
    >
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="w-100" style={{ maxWidth: "500px" }}>
          {/* <Button
            variant={darkMode ? "light" : "dark"}
            onClick={toggleDarkMode}
            className="mb-3"
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </Button> */}
          <h2 className="text-center mb-4">Admin Signup</h2>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form
            onSubmit={handleSubmit}
            className={`p-4 border rounded shadow ${
              darkMode ? "bg-dark text-light" : "bg-light"
            }`}
          >
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter name"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>mobileNumber</Form.Label>
              <Form.Control
                type="text"
                name="mobileNumber"
                placeholder="Enter mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                isInvalid={!!errors.mobileNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.mobileNumber}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formRole">
              <Form.Label>Role</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="checkbox"
                  id="admin-role"
                  label="Admin"
                  name="role"
                  value="Admin"
                  checked={formData.role === "Admin"}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="checkbox"
                  id="superadmin-role"
                  label="SuperAdmin"
                  name="role"
                  value="SuperAdmin"
                  checked={formData.role === "SuperAdmin"}
                  onChange={handleChange}
                />
              </div>
              {errors.role && (
                <div className="text-danger mt-1">{errors.role}</div>
              )}
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Signup
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default AdminSignupForm;
