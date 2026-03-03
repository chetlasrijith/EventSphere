// OrganizerSignupForm.js
import React, { useState } from "react";
import { Form, Button, Container, Alert, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

const OrganizerSignupForm = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    mobileNumber: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.username) errors.username = "Username is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (!formData.email) errors.email = "Email is required.";
    if (formData.mobileNumber && !/^[0-9]{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = "Mobile number must be a 10-digit number.";
    }
    Object.keys(formData.address).forEach((key) => {
      if (!formData.address[key]) {
        errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required.`;
      }
    });
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(`http://localhost:8000/api/auth/organizer/signup`, // Backend login endpoint
            formData, // Data from form (e.g., email, password)
            {
                headers: {
                    "Content-Type": "application/json", // Explicitly set content type
                },
                withCredentials: true, // Send cookies with request
            }); // Replace with your backend endpoint
      toast.success("Login successful!");
      setSuccessMessage("Login successful!");
      Navigator("/");
      window.location.reload();
      setErrorMessage("");
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message || "An error occurred during signup."
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
        <div className="w-100" style={{ maxWidth: "600px" }}>
          {/* <Button
            variant={darkMode ? "light" : "dark"}
            onClick={toggleDarkMode}
            className="mb-3"
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </Button> */}
          <h2 className="text-center mb-4">Organizer Signup</h2>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form
            onSubmit={handleSubmit}
            className={`p-4 border rounded shadow ${
              darkMode ? "bg-dark text-light" : "bg-light"
            }`}
          >
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
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

            <Form.Group className="mb-3" controlId="formMobileNumber">
              <Form.Label>Mobile Number</Form.Label>
              <Form.Control
                type="text"
                name="mobileNumber"
                placeholder="Enter mobile number (optional)"
                value={formData.mobileNumber}
                onChange={handleChange}
                isInvalid={!!errors.mobileNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.mobileNumber}
              </Form.Control.Feedback>
            </Form.Group>

            <h4 className="mt-3">Address</h4>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formStreet">
                  <Form.Label>Street</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.street"
                    placeholder="Street"
                    value={formData.address.street}
                    onChange={handleChange}
                    isInvalid={!!errors.street}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.street}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formCity">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.city"
                    placeholder="City"
                    value={formData.address.city}
                    onChange={handleChange}
                    isInvalid={!!errors.city}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formState">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.state"
                    placeholder="State"
                    value={formData.address.state}
                    onChange={handleChange}
                    isInvalid={!!errors.state}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formPostalCode">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.postalCode"
                    placeholder="Postal Code"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    isInvalid={!!errors.postalCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.postalCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="formCountry">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                name="address.country"
                placeholder="Country"
                value={formData.address.country}
                onChange={handleChange}
                isInvalid={!!errors.country}
              />
              <Form.Control.Feedback type="invalid">
                {errors.country}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Sign Up
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default OrganizerSignupForm;
