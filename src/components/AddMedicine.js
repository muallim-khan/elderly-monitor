import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  Container, Card, Form, Button, Alert, Row, Col
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { 
  FaPills, FaClock, FaPlus, FaCheckCircle
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import SideNav from './SideNav';
import { useNavigate } from 'react-router-dom';

export default function AddMedicine() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [medicineName, setMedicineName] = useState('');
  const [medicineTime, setMedicineTime] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!medicineName || !medicineTime) {
      toast.error('Please fill in medicine name and time');
      return;
    }

    setLoading(true);

    try {
      // Add medicine reminder to Firestore
      await addDoc(collection(db, 'medicineReminders'), {
        userId: currentUser.uid,
        medicineName: medicineName,
        time: medicineTime,
        dosage: dosage || 'Not specified',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        active: true
      });

      toast.success('✅ Medicine reminder added successfully!');
      
      // Reset form
      setMedicineName('');
      setMedicineTime('');
      setDosage('');
      setNotes('');
      
      // Navigate to medicine list after 1.5 seconds
      setTimeout(() => {
        navigate('/select-medicine');
      }, 1500);

    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine reminder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="px-0">
      <SideNav />
      
      <div className="d-lg-none" style={{ height: '56px' }}></div>

      <main className="px-3 px-lg-4 py-4" style={{ marginLeft: '0', paddingTop: '100px' }}>
        <style>
          {`
            @media (min-width: 992px) {
              main {
                margin-left: 280px !important;
                padding-top: 24px !important;
              }
            }
          `}
        </style>

        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold">
              <FaPills className="me-2 text-primary" />
              Add Medicine Reminder
            </h2>
            <p className="text-muted">Create a new medication schedule</p>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <Alert variant="info" className="mb-4">
                    <FaClock className="me-2" />
                    <strong>Reminder System:</strong> You'll receive notifications when it's time to take your medicine!
                  </Alert>

                  <Form onSubmit={handleSubmit}>
                    {/* Medicine Name */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <FaPills className="me-2 text-primary" />
                        Medicine Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Aspirin, Paracetamol, Vitamin C"
                        value={medicineName}
                        onChange={(e) => setMedicineName(e.target.value)}
                        required
                        size="lg"
                      />
                    </Form.Group>

                    {/* Time */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <FaClock className="me-2 text-success" />
                        Reminder Time *
                      </Form.Label>
                      <Form.Control
                        type="time"
                        value={medicineTime}
                        onChange={(e) => setMedicineTime(e.target.value)}
                        required
                        size="lg"
                      />
                      <Form.Text className="text-muted">
                        Select the time when you need to take this medicine
                      </Form.Text>
                    </Form.Group>

                    {/* Dosage */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        Dosage (Optional)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., 1 tablet, 500mg, 2 capsules"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        size="lg"
                      />
                    </Form.Group>

                    {/* Notes */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        Notes (Optional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="e.g., Take with food, After meal, Before sleep"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </Form.Group>

                    {/* Buttons */}
                    <div className="d-flex gap-3">
                      <motion.div whileTap={{ scale: 0.98 }} className="flex-grow-1">
                        <Button 
                          variant="primary" 
                          type="submit" 
                          size="lg"
                          className="w-100 fw-bold"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Adding...
                            </>
                          ) : (
                            <>
                              <FaPlus className="me-2" />
                              Add Reminder
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <Button 
                        variant="outline-secondary" 
                        size="lg"
                        onClick={() => navigate('/select-medicine')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>

                  {/* Preview Card */}
                  {medicineName && medicineTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Card className="bg-light border-primary">
                        <Card.Body>
                          <h6 className="fw-bold mb-3">
                            <FaCheckCircle className="me-2 text-success" />
                            Preview
                          </h6>
                          <div className="mb-2">
                            <strong>Medicine:</strong> {medicineName}
                          </div>
                          <div className="mb-2">
                            <strong>Time:</strong> {medicineTime}
                          </div>
                          {dosage && (
                            <div className="mb-2">
                              <strong>Dosage:</strong> {dosage}
                            </div>
                          )}
                          {notes && (
                            <div>
                              <strong>Notes:</strong> {notes}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </motion.div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </main>
    </Container>
  );
}