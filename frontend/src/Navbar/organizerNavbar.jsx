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

  const handleToHomePage = () => {
    navigate("");
  };
  const organizerLogOut =async ()=>{
    try{
      const response  = await axios.get("http://localhost:8000/api/auth/organizer/logout",{
        withCredentials: true,
      })
  }catch(err){
    console.log(err);
  }
  }
  const getOrganizerName = async() => {
        try{
            const response  = await axios.get("http://localhost:8000/api/organizer/getName",{
              withCredentials: true,
            })
            setOrganizerName(response.data.organizerName);
            console.log(response.data.organizerName);
        }catch(err){
          console.log(err);
        }
  }
  useEffect(()=>{
    getOrganizerName();
  }
,[]
  )
  return (
    <Navbar expand="lg" className="bg-dark navbar-dark sticky-top">
      <Container>
        <Navbar.Brand href="#home" className="text-light" as={Link} to="/">
          EventSphere
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
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
          <Nav className="ms-auto d-flex align-items-center">
            <Nav.Link
              as={Link}
              to="/organizer/create-event"
              className="d-flex align-items-center gap-2 text-light ms-3 px-3 py-2 rounded shadow-sm"
              style={buttonStyle}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              <BsFillCalendarPlusFill size={24} />
              <span>Create Event</span>
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="organizer/events"
              className="d-flex align-items-center gap-2 text-light ms-3 px-3 py-2 rounded shadow-sm"
              style={buttonStyle}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              <FiCalendar size={24} />
              <span>Events</span>
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="organizer/notifications"
              className="d-flex align-items-center gap-2 text-light ms-3 px-3 py-2 rounded shadow-sm"
              style={buttonStyle}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              <FaBell size={24} />
              <span>Notifications</span>
            </Nav.Link>
            <NavDropdown
              title={
                <div className="d-flex align-items-center gap-2">
                  <FaUser size={24} />
                  <span>{organizerName}</span>
                </div>
              }
              id="profile-dropdown"
              align="end"
              className="ms-3 text-light"
              menuVariant="dark"
            >
              <NavDropdown.Item as={Link} to="/organizer/messageAdmin" className="d-flex align-items-center gap-2">
                <FaEnvelopeOpenText />
                <span>Message to Admin</span>
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/organizer/updateToAttendees" className="d-flex align-items-center gap-2">
                <FaInfoCircle />
                <span>Update to Attendees</span>
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/organizer/profile" className="d-flex align-items-center gap-2">
                <FaUserEdit />
                <span>Profile</span>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} onClick={organizerLogOut} className="d-flex align-items-center gap-2">
                <FaSignOutAlt />
                <span>Logout</span>
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default BasicExample;
