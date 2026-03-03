import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FaUser } from "react-icons/fa"; // Profile icon
import { Link, useNavigate } from "react-router-dom";
import { BsFillCalendarPlusFill } from "react-icons/bs";
import { FiCalendar } from "react-icons/fi";
import { FaBell, FaEnvelopeOpenText, FaSignOutAlt, FaUserEdit, FaInfoCircle } from "react-icons/fa"; // Added missing icons
import axios from "axios";

function BasicExample() {
  const navigate = useNavigate();
  const [organizerName,setOrganizerName]=useState("Organizer");
  const [checkLogin,setCheckLogin] = useState(false);
  const buttonStyle = {
    backgroundColor: "#1e1e1e",
    border: "1px solid #444",
    color: "#F8FAFC",
    textDecoration: "none",
    fontWeight: "500",
    transition: "background-color 0.3s, color 0.3s",
  };

  const handleHover = (e, isHovering) => {
    e.target.style.backgroundColor = isHovering ? "#444" : "#1e1e1e";
    e.target.style.color = isHovering ? "#FFF" : "#F8FAFC";
  };
  return (
    <Navbar expand="lg" className="bg-dark navbar-dark sticky-top">
      <Container>
        <Navbar.Brand href="#home" className="text-light" as={Link} to="/">
          EventSphere
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="Login" id="basic-nav-dropdown" menuVariant="dark">
              <NavDropdown.Item as={Link} to="/attendee/login">Attendee</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/organizer/login">Organizer</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/admin/login">Admin</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Form className="d-flex me-3">
            <Form.Control
              type="search"
              placeholder="Search"
              className="me-2 bg-dark text-light"
              aria-label="Search"
            />
            <Button variant="outline-light">Search</Button>
          </Form>
          <Nav className="me-auto">
            <NavDropdown title="Location" id="basic-nav-dropdown" menuVariant="dark">
              <NavDropdown.Item href="#action/3.1">Hyderabad</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Goa</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Amaravati</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default BasicExample;
