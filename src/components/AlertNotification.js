import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Toast, ToastContainer } from 'react-bootstrap';
import { 
  FaExclamationTriangle, FaWalking, FaRuler, 
  FaHandPaper, FaBell, FaCheckCircle 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertNotification() {
  const [alerts, setAlerts] = useState([]);
  const [prevState, setPrevState] = useState(null);

  useEffect(() => {
    const docRef = doc(db, "sensorData", "latest");
  
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentState = {
          fallDetected: data.mpu?.fallDetected || false,
          obstacleDetected: data.ultrasonic?.obstacleDetected || false,
          helpPressed: data.button?.helpPressed || false,
          distance: data.ultrasonic?.distance || 0
        };

        // Check for new alerts
        if (prevState) {
          const newAlerts = [];

          // Fall detection
          if (currentState.fallDetected && !prevState.fallDetected) {
            newAlerts.push({
              id: Date.now() + '_fall',
              type: 'danger',
              icon: <FaWalking size={24} />,
              title: '🚨 FALL DETECTED!',
              message: 'Immediate attention required! Elder may have fallen.',
              timestamp: new Date()
            });
          }

          // Obstacle detection
          if (currentState.obstacleDetected && !prevState.obstacleDetected) {
            newAlerts.push({
              id: Date.now() + '_obstacle',
              type: 'warning',
              icon: <FaRuler size={24} />,
              title: '⚠️ Obstacle Detected',
              message: `Object detected ${currentState.distance}cm away. Please check surroundings.`,
              timestamp: new Date()
            });
          }

          // Help button pressed
          if (currentState.helpPressed && !prevState.helpPressed) {
            newAlerts.push({
              id: Date.now() + '_help',
              type: 'danger',
              icon: <FaHandPaper size={24} />,
              title: '🆘 HELP BUTTON PRESSED!',
              message: 'Elder is requesting immediate assistance!',
              timestamp: new Date()
            });
          }

          // Clear alerts
          if (!currentState.fallDetected && prevState.fallDetected) {
            newAlerts.push({
              id: Date.now() + '_fall_clear',
              type: 'success',
              icon: <FaCheckCircle size={24} />,
              title: '✓ Fall Alert Cleared',
              message: 'Fall condition no longer detected.',
              timestamp: new Date()
            });
          }

          if (!currentState.obstacleDetected && prevState.obstacleDetected) {
            newAlerts.push({
              id: Date.now() + '_obstacle_clear',
              type: 'success',
              icon: <FaCheckCircle size={24} />,
              title: '✓ Path Clear',
              message: 'No obstacles detected.',
              timestamp: new Date()
            });
          }

          if (!currentState.helpPressed && prevState.helpPressed) {
            newAlerts.push({
              id: Date.now() + '_help_clear',
              type: 'success',
              icon: <FaCheckCircle size={24} />,
              title: '✓ Help Request Cleared',
              message: 'Help button no longer pressed.',
              timestamp: new Date()
            });
          }

          if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
            
            // Play sound for danger alerts
            if (newAlerts.some(a => a.type === 'danger')) {
              playAlertSound();
            }
          }
        }

        setPrevState(currentState);
      }
    });

    return () => unsubscribe();
  }, [prevState]);

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'primary';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .shake-animation {
            animation: shake 0.5s;
          }
        `}
      </style>

      <ToastContainer 
        position="top-end" 
        className="p-3" 
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: '80px',
          right: '20px'
        }}
      >
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={alert.type === 'danger' ? 'shake-animation' : ''}
            >
              <Toast
                onClose={() => removeAlert(alert.id)}
                show={true}
                delay={alert.type === 'danger' ? 0 : 5000}
                autohide={alert.type !== 'danger'}
                bg={getBgColor(alert.type)}
                className="mb-2 shadow-lg"
                style={{ minWidth: '350px' }}
              >
                <Toast.Header 
                  closeButton={true}
                  className={`bg-${getBgColor(alert.type)} text-white`}
                >
                  <div className="me-2">{alert.icon}</div>
                  <strong className="me-auto">{alert.title}</strong>
                  <small>{alert.timestamp.toLocaleTimeString()}</small>
                </Toast.Header>
                <Toast.Body className={alert.type === 'danger' ? 'text-white' : ''}>
                  <div className="d-flex align-items-center">
                    {alert.type === 'danger' && (
                      <FaBell className="me-2" size={20} />
                    )}
                    <div>{alert.message}</div>
                  </div>
                </Toast.Body>
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
      </ToastContainer>
    </>
  );
}