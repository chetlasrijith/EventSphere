import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const EventRegister = () => {
    const navigate = useNavigate();

    const handlePayment = () => {
        // Redirect to a payment gateway (example: Razorpay, PayPal, Stripe, etc.)
        window.location.href = "https://www.paypal.com"; // Replace with actual payment URL
    };

    return (
        <div style={{ backgroundColor: "#121212", color: "#F8FAFC", minHeight: "100vh", paddingTop: "20px" }}>
            <Container>
                <h1 className="text-center mb-4">Event Registration</h1>
                <Card className="bg-dark text-light border-0 shadow-sm p-4 text-center">
                    <Card.Body>
                        <Card.Title className="mb-3" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                            Complete Your Registration
                        </Card.Title>
                        <Card.Text className="mb-4">
                            Click the button below to proceed to payment and confirm your registration.
                        </Card.Text>
                        <Button variant="success" size="lg" onClick={handlePayment}>
                            Proceed to Payment
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default EventRegister;