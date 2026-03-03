import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Container, Row, Col, Button } from 'react-bootstrap';
import { AiOutlineMail, AiOutlineArrowLeft } from 'react-icons/ai';
import { MdEventNote } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const NotificationDetails = () => {
  const navigate = useNavigate();
  const [notification,setNotification] = useState({});
  const {notificationId}=useParams();

  const handleBackNotifications = () => {
    navigate('/organizer/notifications');
  };
  const fetchNotification = async () => {
    console.log(`${import.meta.env.VITE_BACKEND_SERVER}`)
    try{
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/organizer/notification/${notificationId}`,{
        withCredentials:true,
      });
      console.log(response);
      if(response.status === 200){
        setNotification(response.data);
      }
    }catch(err){
      console.log(err);
    }
  }
  useEffect(()=>{
    fetchNotification();
  },[])
  return (
    <div
      style={{
        backgroundColor: '#121212',
        color: '#E0E0E0',
        minHeight: '100vh',
        padding: '40px',
        overflowX: 'hidden', // Prevent horizontal scrolling
      }}
    >
      <Container
        className="py-4"
        style={{
          maxWidth: '800px',
          backgroundColor: '#1F1F1F',
          borderRadius: '12px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          overflowX: 'hidden', // Ensure no horizontal scrolling inside the container
        }}
      >
        <Button
          onClick={handleBackNotifications}
          variant="secondary"
          className="mb-4"
          style={{ backgroundColor: '#BB86FC', border: 'none', whiteSpace: 'nowrap' }}
        >
          <AiOutlineArrowLeft className="me-2" size={20} /> Back to Notifications
        </Button>

        <Card className="shadow-sm border-0 rounded-3" style={{ backgroundColor: '#2A2A2A', overflow: 'hidden' }}>
          <Card.Body>
            <Row className="align-items-center mb-4 gx-0"> {/* Prevents extra spacing */}
              <Col xs="auto">
              <FaUserCircle size={80} className="text-secondary" />
              </Col>
              <Col style={{ minWidth: 0 }}> {/* Prevents content overflow */}
                <h4 style={{ color: '#BB86FC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {notification.subject}
                </h4>
                <p className="mb-1 text-truncate" style={{ color: '#A0A0A0', maxWidth: '100%' }}>
                  From: {notification.from}
                </p>
                <p className="mb-0 text-truncate" style={{ color: '#A0A0A0', maxWidth: '100%' }}>
                  Role: {notification.fromType}
                </p>
                <small style={{ color: '#A0A0A0' }}>{notification.time}</small>
              </Col>
            </Row>

            <hr style={{ borderColor: '#333' }} />

            <Card.Text style={{ fontSize: '1rem', color: '#E0E0E0', wordWrap: 'break-word' }}>
              {notification.message}
            </Card.Text>

            <div className="mt-4">
              {notification.fromType === "Attendee" && (
                <AiOutlineMail size={30} className="text-primary me-3" title="Message from Attendee" />
              )}
              {notification.fromType === "Admin" && (
                <MdEventNote size={30} className="text-warning me-3" title="Admin Note" />
              )}
              {notification.fromType === "EventSphere" && (
                <AiOutlineMail size={30} className="text-info me-3" title="Event Notification" />
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default NotificationDetails;
