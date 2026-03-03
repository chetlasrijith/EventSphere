import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FaBriefcase, FaPlus, FaTrash } from "react-icons/fa";
import axios from "axios";

const OrganizerExperience = ({ experience }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [addData, setAddData] = useState({ organization: "", duration: { years: 0, months: 0 } });
  const [updatedExperience, setUpdatedExperience] = useState(experience || []);
  const apiBaseUrl = "http://localhost:8000";

  const handleChangeExperience = (field, value) => {
    setAddData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmChanges = async () => {
    const newExperience = [...updatedExperience, addData];
    setUpdatedExperience(newExperience);
    setIsFormVisible(false);

    try {
      await axios.put(`${apiBaseUrl}/api/organizer/profile`, { experience: newExperience },{
        withCredentials:true
      });
    } catch (error) {
      console.error("Error updating experience", error);
    }
  };

  const handleRemoveExperience = async (index) => {
    const newExperience = updatedExperience.filter((_, i) => i !== index);
    setUpdatedExperience(newExperience);
    try {
      await axios.put(`${apiBaseUrl}/api/organizer/profile`, { experience: newExperience },{
        withCredentials:true
      });
    } catch (error) {
      console.error("Error removing experience", error);
    }
  };

  return (
    <Card
      className="mb-4"
      style={{
        backgroundColor: "#292929",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.7)",
        color: "#e0e0e0",
        position: "relative",
      }}
    >
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <FaBriefcase className="text-warning me-2" size={24} />
          <h4 className="text-info mb-0">Experience</h4>
        </div>

        <Button
          variant="outline-info"
          size="sm"
          onClick={() => setIsFormVisible(true)}
          style={{ position: "absolute", top: "20px", right: "20px" }}
        >
          <FaPlus className="me-1" /> Add Experience
        </Button>

        {updatedExperience?.length > 0 ? (
          <ul>
            {updatedExperience.map((exp, index) => (
              <li key={index} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Organization:</strong> {exp.organization} <br />
                  <strong>Duration:</strong> {`${exp.duration?.years || 0} years, ${exp.duration?.months || 0} months`}
                </div>
                <FaTrash
                  color="#ff4d4d"
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                  onClick={() => handleRemoveExperience(index)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No experience available.</p>
        )}

        {isFormVisible && (
          <div className="d-flex flex-column justify-content-between align-items-start mt-3">
            <Form>
              <Form.Group>
                <Form.Label>Organization</Form.Label>
                <Form.Control
                  type="text"
                  value={addData.organization}
                  onChange={(e) => handleChangeExperience("organization", e.target.value)}
                  placeholder="Enter organization name"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Duration</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="number"
                    onChange={(e) =>
                      handleChangeExperience("duration", {
                        years: parseInt(e.target.value) || 0,
                        months: addData.duration?.months || 0,
                      })
                    }
                    placeholder="Years"
                    style={{ width: "80px", marginRight: "8px" }}
                  />
                  <Form.Control
                    type="number"
                    onChange={(e) =>
                      handleChangeExperience("duration", {
                        years: addData.duration?.years || 0,
                        months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Months"
                    style={{ width: "80px" }}
                  />
                </div>
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

export default OrganizerExperience;
