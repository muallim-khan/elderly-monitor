import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { 
  Container, Card, Button, Badge, Spinner, Alert, Row, Col, Modal
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { 
  FaPills, FaClock, FaTrash, FaPlus, FaBell,
  FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SideNav from './SideNav';
import { useNavigate } from 'react-router-dom';

export default function SelectMedicine() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch medicines from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'medicineReminders'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const medicinesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMedicines(medicinesList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Check medicine times and create alerts in Firebase
  useEffect(() => {
    if (!medicines.length) return;

    const checkMedicineTimes = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      for (const medicine of medicines) {
        const medicineTimeStr = medicine.time;
        
        // Check if current time matches medicine time
        if (currentTimeStr === medicineTimeStr) {
          try {
            // Create/Update alert in Firebase
            // await setDoc(doc(db, 'medicineAlerts', medicine.id), {
            //   userId: currentUser.uid,
            //   medicineId: medicine.id,
            //   medicineName: medicine.medicineName,
            //   dosage: medicine.dosage,
            //   time: medicine.time,
            //   alertActive: true,
            //   triggeredAt: new Date().toISOString()
            // });
            // When time matches:
await setDoc(doc(db, 'medicineAlerts', 'currentAlert'), {
  userId: currentUser.uid,
  medicineName: medicine.medicineName,
  dosage: medicine.dosage,
  time: medicine.time,
  alertActive: true,
  triggeredAt: new Date().toISOString()
});



            console.log(`🔔 Alert created for: ${medicine.medicineName}`);

            // Set timeout to deactivate alert after 1 minute
            setTimeout(async () => {
              try {
                await setDoc(doc(db, 'medicineAlerts', 'currentAlert'), {
                  userId: currentUser.uid,
                  medicineId: medicine.id,
                  medicineName: medicine.medicineName,
                  dosage: medicine.dosage,
                  time: medicine.time,
                  alertActive: false,
                  deactivatedAt: new Date().toISOString()
                });
                console.log(`✓ Alert deactivated for: ${medicine.medicineName}`);
              } catch (error) {
                console.error('Error deactivating alert:', error);
              }
            }, 60000); // 1 minute

          } catch (error) {
            console.error('Error creating alert:', error);
          }
        }
      }
    };

    checkMedicineTimes();
  }, [currentTime, medicines, currentUser]);

  const handleDeleteClick = (medicine) => {
    setMedicineToDelete(medicine);
    setShowDeleteModal(true);
  };


  const handleDeleteConfirm = async () => {
    if (!medicineToDelete) return;

    try {
      await deleteDoc(doc(db, 'medicineReminders', medicineToDelete.id));
      
      // Also delete associated alert if exists
      try {
        await deleteDoc(doc(db, 'medicineAlerts', medicineToDelete.id));
      } catch (err) {
        // Alert might not exist, that's okay
      }

      toast.success('✅ Medicine reminder deleted successfully');
      setShowDeleteModal(false);
      setMedicineToDelete(null);
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine reminder');
    }
  };

  const isTimeNear = (medicineTime) => {
    if (!medicineTime) return false;
    
    const [hours, minutes] = medicineTime.split(':').map(Number);
    const now = new Date();
    const medicineDate = new Date();
    medicineDate.setHours(hours, minutes, 0, 0);
    
    const diff = medicineDate - now;
    const diffMinutes = Math.floor(diff / 60000);
    
    // Return true if within 5 minutes
    return diffMinutes >= 0 && diffMinutes <= 5;
  };

  const formatTime = (time24) => {
    if (!time24) return 'N/A';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
            .medicine-card {
              transition: all 0.3s ease;
              border-left: 4px solid transparent;
            }
            .medicine-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
            }
            .medicine-card.time-near {
              border-left-color: #ffc107;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          `}
        </style>

        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold">
              <FaPills className="me-2 text-primary" />
              Medicine Reminders
            </h2>
            <p className="text-muted">
              Current time: <strong>{currentTime.toLocaleTimeString()}</strong>
            </p>
          </Col>
          <Col xs="auto">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/add-medicine')}
            >
              <FaPlus className="me-2" />
              Add New
            </Button>
          </Col>
        </Row>

        {loading ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 mb-0">Loading medicine reminders...</p>
            </Card.Body>
          </Card>
        ) : medicines.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <FaPills size={64} className="text-muted mb-3" />
              <h4 className="mb-3">No Medicine Reminders</h4>
              <p className="text-muted mb-4">
                You haven't added any medicine reminders yet.
              </p>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/add-medicine')}
              >
                <FaPlus className="me-2" />
                Add Your First Reminder
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <Alert variant="info" className="mb-4">
              <FaBell className="me-2" />
              <strong>Auto-Alert System Active:</strong> You'll receive alerts when it's time to take your medicine. 
              Alerts stay active for 1 minute.
            </Alert>

            <Row className="g-4">
              <AnimatePresence>
                {medicines.map((medicine) => {
                  const timeNear = isTimeNear(medicine.time);
                  
                  return (
                    <Col key={medicine.id} xs={12} md={6} lg={4}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className={`shadow-sm medicine-card h-100 ${timeNear ? 'time-near' : ''}`}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="flex-grow-1">
                                <h5 className="fw-bold mb-1">
                                  <FaPills className="me-2 text-primary" />
                                  {medicine.medicineName}
                                </h5>
                                {timeNear && (
                                  <Badge bg="warning" className="mb-2">
                                    <FaBell className="me-1" />
                                    Time Soon!
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(medicine)}
                              >
                                <FaTrash />
                              </Button>
                            </div>

                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                                <FaClock className="text-success me-2" size={20} />
                                <div>
                                  <small className="text-muted d-block">Reminder Time</small>
                                  <strong className="fs-5">{formatTime(medicine.time)}</strong>
                                </div>
                              </div>

                              <div className="p-2 bg-light rounded">
                                <small className="text-muted d-block mb-1">Dosage</small>
                                <strong>{medicine.dosage || 'Not specified'}</strong>
                              </div>
                            </div>

                            {medicine.notes && (
                              <Alert variant="secondary" className="mb-0 py-2">
                                <small>
                                  <strong>Notes:</strong> {medicine.notes}
                                </small>
                              </Alert>
                            )}

                            <div className="mt-3 pt-3 border-top">
                              <small className="text-muted">
                                <FaCheckCircle className="me-1 text-success" />
                                Added: {new Date(medicine.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                          </Card.Body>
                        </Card>
                      </motion.div>
                    </Col>
                  );
                })}
              </AnimatePresence>
            </Row>

            {/* Summary Card */}
            <Card className="shadow-sm mt-4">
              <Card.Body>
                <Row className="text-center">
                  <Col md={4}>
                    <h3 className="text-primary fw-bold">{medicines.length}</h3>
                    <small className="text-muted">Total Reminders</small>
                  </Col>
                  <Col md={4}>
                    <h3 className="text-warning fw-bold">
                      {medicines.filter(m => isTimeNear(m.time)).length}
                    </h3>
                    <small className="text-muted">Due Soon (5 min)</small>
                  </Col>
                  <Col md={4}>
                    <h3 className="text-success fw-bold">
                      <FaBell />
                    </h3>
                    <small className="text-muted">Auto-Alerts Active</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationCircle className="me-2 text-warning" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to delete the reminder for{' '}
            <strong>{medicineToDelete?.medicineName}</strong>?
          </p>
          <Alert variant="warning" className="mt-3 mb-0">
            <small>This action cannot be undone.</small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FaTrash className="me-2" />
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}