// OrganizerLoginForm.js
import React, { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

const OrganizerLoginForm = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.username) errors.username = "Username is required.";
    if (!formData.password) errors.password = "Password is required.";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (!validateForm()) return; // Validate form data before proceeding

    setIsLoading(true); // Start loading spinner or indicator

    try {
        // Make the POST request to the backend
        const response = await axios.post(
            `http://localhost:8000/api/auth/organizer/login`, // Backend login endpoint
            formData, // Data from form (e.g., email, password)
            {
                headers: {
                    "Content-Type": "application/json", // Explicitly set content type
                },
                withCredentials: true, // Send cookies with request
            }
        );

        // Handle successful login
        toast.success("Login successful!");
        setSuccessMessage("Login successful!");
        Navigator("/");
        window.location.reload();
        setErrorMessage(""); // Clear any previous error messages
        console.log(response.data); // Log the response for debugging
    } catch (error) {
        // Handle errors
        setSuccessMessage(""); // Clear success message
        setErrorMessage(
            error.response?.data?.message || error.message || "An unexpected error occurred."
        );
        console.error("Error during login:", error); // Log error for debugging
    } finally {
        setIsLoading(false); // Stop loading spinner or indicator
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
        <div className="w-100" style={{ maxWidth: "400px" }}>
          {/* <Button
            variant={darkMode ? "light" : "dark"}
            onClick={toggleDarkMode}
            className="mb-3"
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </Button> */}
          <h2 className="text-center mb-4">Organizer Login</h2>
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

            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
          </Form>
          <div className="mt-3 text-center">
            <p>
              Don't have an account?{" "}
              <Link to="/organizer/signup" style={{ color: darkMode ? "#f8f9fa" : "#007bff" }}>
                Signup here
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default OrganizerLoginForm;
