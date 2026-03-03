// LoginForm.js
import React, { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const Navigator = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER}/api/auth/attendee/login`, formData,{
        withCredentials:true,
      }); // Replace with your backend endpoint
      // setSuccessMessage("Login successful!");
      setErrorMessage("");
      toast.success("Login successful!");
      Navigator("/");
      window.location.reload();
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error.response?.data?.message || "An error occurred during login."
      );
    }
  };

  return (
    <Container
      className="mt-5 d-flex justify-content-center"
      style={{ maxWidth: "400px" }}
    >
      <div className="w-100">
        <h2 className="text-center mb-4">Login</h2>
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form onSubmit={handleSubmit} className="p-4 border rounded shadow">
          {/* Username Field */}
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!errors.username}
            />
            <Form.Control.Feedback type="invalid">
              {errors.username}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!errors.password}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Submit Button */}
          <Button variant="primary" type="submit" className="w-100">
            Login
          </Button>
        </Form>

        {/* Sign Up Link */}
        <p className="mt-3 text-center">
          Don't have an account?{" "}
          <Link to="/attendee/signup" className="text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </Container>
  );
};

export default LoginForm;
