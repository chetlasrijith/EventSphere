import { useEffect, useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FaPlus, FaTrash, FaMedal } from "react-icons/fa";
import axios from "axios";

const apiBaseUrl = "http://localhost:8000";

const OrganizerAchievements = ({ achievements }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newAchievement, setNewAchievement] = useState("");
  const [updatedAchievements, setUpdatedAchievements] = useState(achievements || []);


  useEffect(()=>{
    console.log(achievements)
  },[])

  const handleConfirmChanges = async () => {
    const newAchievements = [...updatedAchievements, newAchievement];
    setUpdatedAchievements(newAchievements);
    setIsFormVisible(false);
    try {
      await axios.put(
        `${apiBaseUrl}/api/organizer/profile`,
        { acheivments: newAchievements },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error updating achievements", error);
    }
  };

  const handleRemoveAchievement = async (index) => {
    const newAchievements = updatedAchievements.filter((_, i) => i !== index);
    setUpdatedAchievements(newAchievements);
    try {
      await axios.put(
        `${apiBaseUrl}/api/organizer/profile`,
        { acheivments: newAchievements },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error removing achievement", error);
    }
  };

  return (
    <Card
      className="mb-4"
      style={{
        backgroundColor: "#1f1f1f",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.6)",
        color: "#e0e0e0",
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center mb-3">
            <FaMedal className="text-warning me-2" size={24} />
            <h4 className="text-info mb-0">Achievements</h4>
          </div>
          <Button variant="outline-info" size="sm" onClick={() => setIsFormVisible(true)}>
            <FaPlus className="me-1" /> Add Achievement
          </Button>
        </div>

        {updatedAchievements.length > 0 ? (
          <ul>
            {updatedAchievements.map((ach, index) => (
              <li key={index} className="d-flex justify-content-between align-items-center">
                <span>{ach}</span>
                <FaTrash
                  color="#ff4d4d"
                  style={{ cursor: "pointer", marginLeft: "8px" }}
                  onClick={() => handleRemoveAchievement(index)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No achievements listed.</p>
        )}

        {isFormVisible && (
          <div className="d-flex flex-column justify-content-between align-items-start mt-3">
            <Form>
              <Form.Group>
                <Form.Label>Achievement</Form.Label>
                <Form.Control
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="Enter achievement"
                />
              </Form.Group>
              <div className="d-flex mt-3">
                <Button variant="outline-info" size="sm" onClick={handleConfirmChanges}>
                  Save Changes
                </Button>
                <FaTrash
                  color="#ff4d4d"
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                  onClick={() => setIsFormVisible(false)}
                />
              </div>
            </Form>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrganizerAchievements;
