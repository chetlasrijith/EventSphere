import React from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ProfileUpdateModal = ({ showModal, setShowModal, formData, setFormData, handleSave }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <Modal
      show={showModal}
      onHide={() => setShowModal(false)}
      centered
      dialogClassName="custom-modal"
      backdrop="static"
      style={{ maxWidth: "100rem", margin: "0 auto" }}
    >
      <Modal.Header
        closeButton
        closeVariant="white"
        style={{ backgroundColor: "#343a40", color: "#fff", padding: "10px 15px", position: "sticky", top: 0, zIndex: 1020 }}
      >
        <Modal.Title>Update Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{ backgroundColor: "#1f1f1f", color: "#e0e0e0", padding: "15px", overflowY: "auto", maxHeight: "calc(100vh - 150px)" }}
      >
        <Form>
          {["username", "about", "email", "mobileNumber"].map((field) => (
            <Form.Group className="mb-3" key={field}>
              <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
              <Form.Control
                type={field === "about" ? "textarea" : "text"}
                as={field === "about" ? "textarea" : "input"}
                rows={field === "about" ? 3 : undefined}
                name={field}
                value={formData[field] || ""}
                onChange={handleInputChange}
                style={{ backgroundColor: "#343a40", color: "#e0e0e0" }}
              />
            </Form.Group>
          ))}

          {Object.entries(formData.address || {}).map(([key, value]) => (
            <Form.Group className="mb-3" key={key}>
              <Form.Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Form.Label>
              <Form.Control
                type="text"
                name={key}
                value={value || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, [e.target.name]: e.target.value },
                  }))
                }
                style={{ backgroundColor: "#343a40", color: "#e0e0e0" }}
              />
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer
        style={{ backgroundColor: "#343a40", padding: "10px 15px", position: "sticky", bottom: 0, zIndex: 1020 }}
      >
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileUpdateModal;