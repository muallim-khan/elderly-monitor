import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaBell, FaPills, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MedicineAlertWidget() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'medicineAlerts'),
      where('userId', '==', currentUser.uid),
      where('alertActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveAlerts(alerts);

      // Play sound if there are active alerts
      if (alerts.length > 0) {
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  if (activeAlerts.length === 0) return null;

  return (
    <AnimatePresence>
      {activeAlerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Card className="shadow border-danger border-3">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 15, -15, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1
                    }}
                  >
                    <div className="p-3 rounded-circle bg-danger text-white">
                      <FaBell size={28} />
                    </div>
                  </motion.div>
                  <div>
                    <h4 className="mb-1 fw-bold text-danger">
                      🔔 Medicine Reminder!
                    </h4>
                    <h5 className="mb-2">
                      <FaPills className="me-2 text-primary" />
                      {alert.medicineName}
                    </h5>
                    <div className="d-flex gap-3">
                      <Badge bg="danger" className="px-3 py-2">
                        <FaClock className="me-1" />
                        Time: {alert.time}
                      </Badge>
                      <Badge bg="info" className="px-3 py-2">
                        Dosage: {alert.dosage}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/select-medicine')}
                    className="mb-2"
                  >
                    View All
                  </Button>
                  <div>
                    <small className="text-muted">
                      Alert active for 1 minute
                    </small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}