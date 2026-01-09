
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, Card, Badge, Alert, 
  Spinner, Row, Col, ProgressBar, Stack
} from 'react-bootstrap';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import SideNav from './SideNav';
import MedicineAlertWidget from './MedicineAlertWidget';

import { 
  FaWalking, FaExclamationTriangle, FaCheckCircle,
  FaMapMarkerAlt, FaRuler, FaHandPaper, FaBell,
  FaChartLine, FaWifi, FaClock
} from 'react-icons/fa';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sensorData, setSensorData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    accelX: [],
    accelY: [],
    accelZ: []
  });
  const [deviceStatus, setDeviceStatus] = useState('connected');

  useEffect(() => {
    const docRef = doc(db, "sensorData", "latest");
  
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("✅ Firebase data received:", data);
        
        setSensorData(data);
        setLastUpdate(new Date());
        setLoading(false);
        setDeviceStatus('connected');
  
        // Update chart data
        setChartData(prev => {
          const newLabels = [...prev.labels, new Date().toLocaleTimeString()];
          const newAccelX = [...prev.accelX, data.mpu?.accelX || 0];
          const newAccelY = [...prev.accelY, data.mpu?.accelY || 0];
          const newAccelZ = [...prev.accelZ, data.mpu?.accelZ || 0];
  
          // Keep only last 15 readings
          if (newLabels.length > 15) {
            newLabels.shift();
            newAccelX.shift();
            newAccelY.shift();
            newAccelZ.shift();
          }
  
          return {
            labels: newLabels,
            accelX: newAccelX,
            accelY: newAccelY,
            accelZ: newAccelZ
          };
        });
      } else {
        console.log("❌ No document found in sensorData/latest");
        setLoading(false);
      }
    }, (error) => {
      console.error("❌ Firebase error:", error);
      setDeviceStatus('disconnected');
      setLoading(false);
    });
  
    // Check for disconnection after 10 seconds of no update
    const checkInterval = setInterval(() => {
      if (lastUpdate && (Date.now() - lastUpdate.getTime() > 10000)) {
        setDeviceStatus('disconnected');
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, [lastUpdate]);

  // Prepare acceleration chart data
  const accelerationChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Accel X (g)',
        data: chartData.accelX,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Accel Y (g)',
        data: chartData.accelY,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Accel Z (g)',
        data: chartData.accelZ,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const getAlertColor = () => {
    if (!sensorData) return 'secondary';
    const { mpu, ultrasonic, button } = sensorData;
    if (mpu?.fallDetected || ultrasonic?.obstacleDetected || button?.helpPressed) {
      return 'danger';
    }
    return 'success';
  };

  const getAlertMessage = () => {
    if (!sensorData) return 'Waiting for data...';
    const { mpu, ultrasonic, button } = sensorData;
    
    const alerts = [];
    if (mpu?.fallDetected) alerts.push('🚨 Fall Detected!');
    if (ultrasonic?.obstacleDetected) alerts.push('⚠️ Obstacle Nearby!');
    if (button?.helpPressed) alerts.push('🆘 Help Button Pressed!');
    
    if (alerts.length > 0) return alerts.join(' | ');
    return '✓ All Systems Normal';
  };

  return (
    <Container fluid className="px-0">
      <SideNav />
      
      {/* Status Bar for Mobile */}
      <div className="d-lg-none bg-primary text-white p-2 text-center fixed-top" style={{ marginTop: '56px', zIndex: 1020 }}>
        <Stack direction="horizontal" gap={3} className="justify-content-center">
          <FaWifi className={deviceStatus === 'connected' ? 'text-success' : 'text-danger'} />
          <span>Device: {deviceStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
        </Stack>
      </div>

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
            <h2 className="fw-bold">🏥 Elderly Monitoring Dashboard</h2>
            <p className="text-muted">Real-time health and safety monitoring system</p>
          </Col>
          <Col xs="auto">
            <div className="d-flex align-items-center gap-2">
              <FaClock className="text-muted" />
              <small className="text-muted">
                Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
              </small>
            </div>
          </Col>
        </Row>




        <MedicineAlertWidget />

        {loading ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 mb-0">Connecting to Firebase...</p>
              <small className="text-muted">Loading sensor data from sensorData/latest</small>
            </Card.Body>
          </Card>
        ) : !sensorData ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <FaBell size={48} className="text-warning" />
              </div>
              <h4 className="mb-3">No Data Available</h4>
              <p className="text-muted mb-2">
                Could not find document at: <code>sensorData/latest</code>
              </p>
              <p className="text-muted">
                Please ensure:<br />
                • ESP32 is connected to WiFi<br />
                • Firebase credentials are correct<br />
                • Data is being sent every 3 seconds
              </p>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Alert Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert 
                variant={getAlertColor()} 
                className="mb-4 d-flex align-items-center justify-content-between shadow-sm"
              >
                <div className="d-flex align-items-center gap-3">
                  {getAlertColor() === 'danger' ? (
                    <FaExclamationTriangle size={24} />
                  ) : (
                    <FaCheckCircle size={24} />
                  )}
                  <div>
                    <h5 className="mb-0">{getAlertMessage()}</h5>
                    <small>
                      {getAlertColor() === 'danger' 
                        ? 'Immediate attention required!' 
                        : 'Everything is functioning normally'}
                    </small>
                  </div>
                </div>
                {sensorData.alert?.active && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Badge bg="danger" className="fs-6 px-3 py-2">
                      <FaBell className="me-2" />
                      ALERT ACTIVE
                    </Badge>
                  </motion.div>
                )}
              </Alert>
            </motion.div>

            {/* Sensor Status Cards */}
            <Row className="g-4 mb-4">
              {/* Fall Detection Card */}
              <Col xs={12} md={6} lg={3}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-100 shadow-sm border-${sensorData.mpu?.fallDetected ? 'danger' : 'success'} border-3`}>
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className={`p-3 rounded-circle bg-${sensorData.mpu?.fallDetected ? 'danger' : 'success'} text-white`}>
                          <FaWalking size={24} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 text-muted">Fall Detection</h6>
                          <h5 className={`mb-0 fw-bold text-${sensorData.mpu?.fallDetected ? 'danger' : 'success'}`}>
                            {sensorData.mpu?.fallDetected ? 'FALL!' : 'Normal'}
                          </h5>
                        </div>
                      </Stack>
                      <div className="mt-3 bg-light p-2 rounded">
                        <small className="text-muted d-block mb-2">Acceleration (g)</small>
                        <div className="d-flex justify-content-between">
                          <div>
                            <small className="text-muted">X</small>
                            <div className="fw-bold">{sensorData.mpu?.accelX?.toFixed(3)}</div>
                          </div>
                          <div>
                            <small className="text-muted">Y</small>
                            <div className="fw-bold">{sensorData.mpu?.accelY?.toFixed(3)}</div>
                          </div>
                          <div>
                            <small className="text-muted">Z</small>
                            <div className="fw-bold">{sensorData.mpu?.accelZ?.toFixed(3)}</div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>

              {/* Obstacle Detection Card */}
              <Col xs={12} md={6} lg={3}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-100 shadow-sm border-${sensorData.ultrasonic?.obstacleDetected ? 'warning' : 'success'} border-3`}>
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className={`p-3 rounded-circle bg-${sensorData.ultrasonic?.obstacleDetected ? 'warning' : 'success'} text-white`}>
                          <FaRuler size={24} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 text-muted">Obstacle</h6>
                          <h5 className={`mb-0 fw-bold text-${sensorData.ultrasonic?.obstacleDetected ? 'warning' : 'success'}`}>
                            {sensorData.ultrasonic?.obstacleDetected ? 'Detected!' : 'Clear'}
                          </h5>
                        </div>
                      </Stack>
                      <div className="mt-3">
                        <h2 className="mb-2 fw-bold">
                          {sensorData.ultrasonic?.distance >= 0 ? sensorData.ultrasonic?.distance : 'N/A'} 
                          <small className="fs-6 text-muted ms-1">cm</small>
                        </h2>
                        <ProgressBar 
                          variant={sensorData.ultrasonic?.obstacleDetected ? 'warning' : 'success'}
                          now={Math.min(Math.max(sensorData.ultrasonic?.distance || 0, 0), 100)} 
                          max={100}
                          style={{ height: '8px' }}
                        />
                        <small className="text-muted">⚠️ Alert threshold: ≤ 40cm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>

              {/* Help Button Card */}
              <Col xs={12} md={6} lg={3}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`h-100 shadow-sm border-${sensorData.button?.helpPressed ? 'danger' : 'success'} border-3`}>
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className={`p-3 rounded-circle bg-${sensorData.button?.helpPressed ? 'danger' : 'success'} text-white`}>
                          <FaHandPaper size={24} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 text-muted">Help Button</h6>
                          <h5 className={`mb-0 fw-bold text-${sensorData.button?.helpPressed ? 'danger' : 'success'}`}>
                            {sensorData.button?.helpPressed ? 'PRESSED!' : 'Ready'}
                          </h5>
                        </div>
                      </Stack>
                      <div className="mt-3 text-center">
                        {sensorData.button?.helpPressed ? (
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          >
                            <Badge bg="danger" className="fs-5 px-4 py-3 w-100">
                              <FaBell className="me-2" />
                              HELP NEEDED
                            </Badge>
                          </motion.div>
                        ) : (
                          <Badge bg="success" className="fs-6 px-3 py-2 w-100">
                            <FaCheckCircle className="me-2" />
                            Standby Mode
                          </Badge>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>

              {/* GPS Location Card */}
              <Col xs={12} md={6} lg={3}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-100 shadow-sm border-info border-3">
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="p-3 rounded-circle bg-info text-white">
                          <FaMapMarkerAlt size={24} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 text-muted">GPS Location</h6>
                          <h5 className="mb-0 fw-bold text-info">
                            {sensorData.gps?.latitude && sensorData.gps?.latitude !== 0 ? 'Active' : 'Searching...'}
                          </h5>
                        </div>
                      </Stack>
                      <div className="mt-3 bg-light p-2 rounded">
                        <div className="mb-2">
                          <small className="text-muted">Latitude</small>
                          <div className="fw-bold text-info">
                            {sensorData.gps?.latitude ? sensorData.gps?.latitude.toFixed(6) + '°' : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <small className="text-muted">Longitude</small>
                          <div className="fw-bold text-info">
                            {sensorData.gps?.longitude ? sensorData.gps?.longitude.toFixed(6) + '°' : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>

            {/* Acceleration Chart */}
            <Row className="g-4 mb-4">
              <Col lg={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Stack direction="horizontal" className="mb-3">
                      <div>
                        <Card.Title className="mb-0">
                          <FaChartLine className="me-2 text-primary" />
                          Motion Activity Monitor
                        </Card.Title>
                        <small className="text-muted">Real-time acceleration tracking</small>
                      </div>
                      <div className="ms-auto">
                        <Badge bg="primary" className="px-3 py-2">
                          <span className="spinner-grow spinner-grow-sm me-2"></span>
                          Live
                        </Badge>
                      </div>
                    </Stack>
                    <div style={{ height: '350px' }}>
                      <Line 
                        data={accelerationChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            mode: 'index',
                            intersect: false,
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: {
                                display: true,
                                text: 'Acceleration (g)',
                                font: { size: 14, weight: 'bold' }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Time',
                                font: { size: 14, weight: 'bold' }
                              },
                              grid: {
                                display: false
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12 }
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: { size: 14 },
                              bodyFont: { size: 13 },
                              callbacks: {
                                label: function(context) {
                                  return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}g`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* System Status Footer */}
            <Card className="shadow-sm">
              <Card.Body>
                <Row className="text-center">
                  <Col xs={6} md={3} className="mb-3 mb-md-0">
                    <FaWifi size={28} className={`mb-2 text-${deviceStatus === 'connected' ? 'success' : 'danger'}`} />
                    <h6 className="mb-1 fw-bold">Connection</h6>
                    <Badge bg={deviceStatus === 'connected' ? 'success' : 'danger'}>
                      {deviceStatus === 'connected' ? 'Online' : 'Offline'}
                    </Badge>
                  </Col>
                  <Col xs={6} md={3} className="mb-3 mb-md-0">
                    <FaCheckCircle size={28} className="mb-2 text-success" />
                    <h6 className="mb-1 fw-bold">Sensors</h6>
                    <Badge bg="success">All Active</Badge>
                  </Col>
                  <Col xs={6} md={3}>
                    <FaBell size={28} className={`mb-2 text-${sensorData.alert?.active ? 'danger' : 'success'}`} />
                    <h6 className="mb-1 fw-bold">Alert Status</h6>
                    <Badge bg={sensorData.alert?.active ? 'danger' : 'success'}>
                      {sensorData.alert?.active ? 'Active' : 'Normal'}
                    </Badge>
                  </Col>
                  <Col xs={6} md={3}>
                    <FaClock size={28} className="mb-2 text-info" />
                    <h6 className="mb-1 fw-bold">Update Rate</h6>
                    <Badge bg="info">Every 3s</Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </main>
    </Container>
  );
}