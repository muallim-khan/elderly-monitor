import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPills, 
  faClock, 
  faCalendarAlt, 
  faBell,
  faSyringe,
  faCapsules,
  faTablets
} from '@fortawesome/free-solid-svg-icons';
import { 
  Card, 
  Form, 
  Button, 
  Row, 
  Col, 
  Alert, 
  ListGroup,
  Badge,
  Modal 
} from 'react-bootstrap';
// import './MedicineReminder.css';

const MedicineReminder = () => {
  const [medicine, setMedicine] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily',
    notes: '',
    type: 'tablet'
  });
  
  const [reminders, setReminders] = useState([]);
  const [activeReminders, setActiveReminders] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);

  // Fetch reminders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'medicines'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const meds = [];
      querySnapshot.forEach((doc) => {
        meds.push({ id: doc.id, ...doc.data() });
      });
      setReminders(meds);
      
      // Check for due reminders
      checkDueReminders(meds);
    });

    return () => unsubscribe();
  }, []);

  // Check for due reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkDueReminders(reminders);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders]);

  const checkDueReminders = async (medList) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dueMeds = medList.filter(med => {
      const [hours, minutes] = med.time.split(':').map(Number);
      const medTime = hours * 60 + minutes;
      
      // Check if current time is within 5 minutes of medication time
      return Math.abs(currentTime - medTime) <= 5;
    });

    setActiveReminders(dueMeds);

    // Update status in Firestore
    dueMeds.forEach(async (med) => {
      const medRef = doc(db, 'medicines', med.id);
      await updateDoc(medRef, {
        isDue: true,
        lastAlert: serverTimestamp()
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'medicines'), {
        ...medicine,
        createdAt: serverTimestamp(),
        isActive: true,
        isDue: false,
        lastTaken: null
      });
      
      setMedicine({
        name: '',
        dosage: '',
        time: '',
        frequency: 'daily',
        notes: '',
        type: 'tablet'
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  const handleTakeMedicine = async (medId) => {
    try {
      await updateDoc(doc(db, 'medicines', medId), {
        lastTaken: serverTimestamp(),
        isDue: false
      });
      
      // Also create a log entry
      await addDoc(collection(db, 'medicineLogs'), {
        medicineId: medId,
        takenAt: serverTimestamp(),
        status: 'taken'
      });
    } catch (error) {
      console.error('Error updating medicine:', error);
    }
  };

  const handleDelete = async () => {
    if (medicineToDelete) {
      try {
        await deleteDoc(doc(db, 'medicines', medicineToDelete));
        setShowDeleteModal(false);
        setMedicineToDelete(null);
      } catch (error) {
        console.error('Error deleting medicine:', error);
      }
    }
  };

  const medicineTypes = [
    { value: 'tablet', icon: faTablets, label: 'Tablet' },
    { value: 'capsule', icon: faCapsules, label: 'Capsule' },
    { value: 'syringe', icon: faSyringe, label: 'Injection' },
    { value: 'liquid', icon: faPills, label: 'Liquid' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice', label: 'Twice a day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  return (
    <div className="medicine-page">
      <div className="page-header mb-4">
        <h1 className="h2 fw-bold">
          <FontAwesomeIcon icon={faPills} className="me-2" />
          Medicine Reminder
        </h1>
        <p className="text-muted">Schedule and manage medication reminders</p>
      </div>

      {/* Active Alerts */}
      {activeReminders.length > 0 && (
        <Alert variant="warning" className="d-flex align-items-center">
          <FontAwesomeIcon icon={faBell} size="lg" className="me-3" />
          <div>
            <h6 className="alert-heading mb-1">Medication Due!</h6>
            {activeReminders.map(med => (
              <div key={med.id} className="d-flex justify-content-between align-items-center mb-1">
                <span>{med.name} - {med.time}</span>
                <Button 
                  size="sm" 
                  variant="success"
                  onClick={() => handleTakeMedicine(med.id)}
                >
                  Mark as Taken
                </Button>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {showSuccess && (
        <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
          Medicine reminder added successfully!
        </Alert>
      )}

      <Row className="g-4">
        {/* Add Medicine Form */}
        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Add New Medicine</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Medicine Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={medicine.name}
                        onChange={(e) => setMedicine({...medicine, name: e.target.value})}
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Dosage</Form.Label>
                      <Form.Control
                        type="text"
                        value={medicine.dosage}
                        onChange={(e) => setMedicine({...medicine, dosage: e.target.value})}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        <FontAwesomeIcon icon={faClock} className="me-1" />
                        Time
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={medicine.time}
                        onChange={(e) => setMedicine({...medicine, time: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                        Frequency
                      </Form.Label>
                      <Form.Select
                        value={medicine.frequency}
                        onChange={(e) => setMedicine({...medicine, frequency: e.target.value})}
                      >
                        {frequencyOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Medicine Type</Form.Label>
                      <div className="d-flex gap-3">
                        {medicineTypes.map(type => (
                          <Form.Check
                            key={type.value}
                            type="radio"
                            id={type.value}
                            label={
                              <>
                                <FontAwesomeIcon icon={type.icon} className="me-1" />
                                {type.label}
                              </>
                            }
                            checked={medicine.type === type.value}
                            onChange={() => setMedicine({...medicine, type: type.value})}
                          />
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Additional Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={medicine.notes}
                        onChange={(e) => setMedicine({...medicine, notes: e.target.value})}
                        placeholder="Special instructions..."
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={12}>
                    <Button type="submit" variant="primary" className="w-100">
                      <FontAwesomeIcon icon={faPills} className="me-2" />
                      Add Reminder
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Today's Schedule */}
        <Col lg={6}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Today's Schedule</Card.Title>
                <Badge bg="primary">
                  {reminders.filter(r => r.isActive).length} Active
                </Badge>
              </div>
              
              {reminders.length === 0 ? (
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faPills} size="3x" className="text-muted mb-3" />
                  <p className="text-muted">No reminders scheduled yet</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {reminders
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((med) => (
                      <ListGroup.Item 
                        key={med.id}
                        className={`d-flex justify-content-between align-items-center ${med.isDue ? 'list-group-item-warning' : ''}`}
                      >
                        <div className="d-flex align-items-center">
                          <div className={`medicine-icon ${med.type}`}>
                            <FontAwesomeIcon icon={
                              medicineTypes.find(t => t.value === med.type)?.icon || faPills
                            } />
                          </div>
                          <div className="ms-3">
                            <h6 className="mb-0">{med.name}</h6>
                            <small className="text-muted">
                              {med.dosage} • {med.time} • {med.frequency}
                            </small>
                            {med.notes && (
                              <small className="d-block text-muted">
                                <em>{med.notes}</em>
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          {med.isDue && (
                            <Badge bg="warning">Due Now</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => {
                              setMedicineToDelete(med.id);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this medicine reminder?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicineReminder;