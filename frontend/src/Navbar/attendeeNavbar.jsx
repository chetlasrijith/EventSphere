import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FaUser } from "react-icons/fa"; // Profile icon
import { Link, useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import { FaBell, FaEnvelopeOpenText, FaSignOutAlt, FaUserEdit, FaInfoCircle } from "react-icons/fa"; // Added missing icons
import axios from "axios";

function BasicExample() {
  const navigate = useNavigate();
  const [attendeeName,setAttendeeName]=useState("Attendee");
  const [checkLogin,setCheckLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/search`, {
        params: { query: searchQuery },
        withCredentials: true,
      });
      navigate("attendee/search-events",{ state: { searchEvents: response.data } }); // Redirect to the home page to display results
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };
  const attendeeLogOut =async ()=>{
    try{
      const response  = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/auth/attendee/logout`,{
        withCredentials: true,
      })
  }catch(err){
    console.log(err);
  }
  }
  const getAttendeeName = async() => {
        try{
            const response  = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/attendee/getName`,{
              withCredentials: true,
            })
            setAttendeeName(response.data.attendeeName);
            setCheckLogin(true);
        }catch(err){
          console.log(err);
        }
  }
  useEffect(()=>{
    getAttendeeName();
  }
,[]
  )
  return (
    <Navbar expand="lg" className="bg-dark navbar-dark sticky-top">
      <Container>
        <Navbar.Brand href="/" className="text-light" as={Link} to="/">
          EventSphere
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Form className="d-flex me-3" onSubmit={handleSearch}>
          <Form.Control
            type="search"
            placeholder="Search by event, category, or artist"
            className="me-2 bg-dark text-light"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline-light" type="submit">
            Search
          </Button>
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
              to="attendee/myevent-list"
              className="d-flex align-items-center gap-2 text-light ms-3 px-3 py-2 rounded shadow-sm"
              style={buttonStyle}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              <FiCalendar size={24} />
              <span>My Events</span>
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="attendee/event-list"
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
              to="attendee/notifications"
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
                  <span>{attendeeName}</span>
                </div>
              }
              id="profile-dropdown"
              align="end"
              className="ms-3 text-light"
              menuVariant="dark"
            >
              <NavDropdown.Item as={Link} to="attendee/profile" className="d-flex align-items-center gap-2">
                <FaUserEdit />
                <span>Profile</span>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} onClick={attendeeLogOut} className="d-flex align-items-center gap-2">
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
