import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, query, collection, orderBy, limit } from 'firebase/firestore';
import { 
  Container, Card, Row, Col, Spinner, 
  Alert, Stack, Badge, ProgressBar
} from 'react-bootstrap';
import { 
  FaPills, FaThermometerHalf, FaTint, 
  FaSun, FaWind, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SideNav from '../components/SideNav';
import MotionState from './MotionState';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function MedicineDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [medicine, setMedicine] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch medicine details
  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const docRef = doc(db, 'medicines', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMedicine(docSnap.data());
        } else {
          setError('Medicine not found');
        }
      } catch (err) {
        setError('Failed to fetch medicine details');
      }
    };

    fetchMedicine();
  }, [id]);


  
  // Fetch real-time sensor data
  useEffect(() => {
    const docRef = doc(db, "sensorData", "latest");
  
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSensorData(docSnap.data());
        setLoading(false);
      } else {
        console.log("No latest data found");
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  // Prepare data for gauge charts
  const getGaugeChartData = (currentValue, threshold, label) => {
    const isSafe = currentValue <= threshold;
    const safeZone = threshold;
    const warningZone = threshold * 1.2; 
    const dangerZone = warningZone * 1.2; 
    
    return {
      labels: [label],
      datasets: [
        {
          data: [currentValue, Math.max(0, safeZone - currentValue), warningZone - safeZone, dangerZone - warningZone],
          backgroundColor: [
            isSafe ? '#28a745' : '#dc3545', // Current value (green if safe, red if unsafe)
            '#d1e7dd', // Safe zone (light green)
            '#fff3cd', // Warning zone (light yellow)
            '#f8d7da'  // Danger zone (light red)
          ],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }
      ]
    };
  };

  const tempChartData = sensorData && medicine ? 
    getGaugeChartData(
      sensorData.dht11.temperature, 
      medicine.temperatureThreshold, 
      'Temperature (°C)'
    ) : null;

  const humidityChartData = sensorData && medicine ? 
    getGaugeChartData(
      sensorData.dht11.humidity, 
      medicine.humidityThreshold, 
      'Humidity (%)'
    ) : null;

  const lightChartData = sensorData && medicine ? 
    getGaugeChartData(
      sensorData.ldr.light, 
      medicine.lightThreshold, 
      'Light (lux)'
    ) : null;

  const gasChartData = sensorData && medicine ? 
    getGaugeChartData(
      sensorData.mq2.gas, 
      medicine.gasThreshold, 
      'Gas (ppm)'
    ) : null;

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
              return `${context.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  return (
    <div className="d-flex">
      <SideNav />
      <Container fluid className="px-0" style={{padding: "38px"}}>
        <main className="px-3 px-lg-4 py-4" >
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading medicine details...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : medicine && sensorData ? (
            <>
              <Row className="mb-4">
                <Col>
                  <Stack direction="horizontal" gap={3} className="align-items-center">
                    <div className="p-3 rounded-circle bg-primary text-white">
                      <FaPills size={24} />
                    </div>
                    <div>
                      <h2 className="fw-bold mb-0">{medicine.name}</h2>
                      <p className="text-muted mb-0">Storage condition monitoring</p>
                    </div>
                  </Stack>
                </Col>
              </Row>

              {/* Gauge Charts */}
              <Row className="g-4 mb-4">
                <Col xs={12} lg={6}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="p-3 rounded-circle bg-danger text-white">
                          <FaThermometerHalf size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0">Temperature</h5>
                          <small className="text-muted">
                            Current: {sensorData.dht11.temperature}°C | Threshold: {medicine.temperatureThreshold}°C
                          </small>
                        </div>
                        {sensorData.dht11.temperature > medicine.temperatureThreshold ? (
                          <Badge bg="danger" className="ms-auto">
                            <FaExclamationTriangle className="me-1" />
                            Unsafe
                          </Badge>
                        ) : (
                          <Badge bg="success" className="ms-auto">
                            <FaCheckCircle className="me-1" />
                            Safe
                          </Badge>
                        )}
                      </Stack>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <Doughnut data={tempChartData} options={gaugeOptions} />
                        <div style={{
                          position: 'absolute',
                          top: '70%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <h4 className="mb-0">{sensorData.dht11.temperature}°C</h4>
                          <small className="text-muted">Current</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} lg={6}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="p-3 rounded-circle bg-info text-white">
                          <FaTint size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0">Humidity</h5>
                          <small className="text-muted">
                            Current: {sensorData.dht11.humidity}% | Threshold: {medicine.humidityThreshold}%
                          </small>
                        </div>
                        {sensorData.dht11.humidity > medicine.humidityThreshold ? (
                          <Badge bg="danger" className="ms-auto">
                            <FaExclamationTriangle className="me-1" />
                            Unsafe
                          </Badge>
                        ) : (
                          <Badge bg="success" className="ms-auto">
                            <FaCheckCircle className="me-1" />
                            Safe
                          </Badge>
                        )}
                      </Stack>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <Doughnut data={humidityChartData} options={gaugeOptions} />
                        <div style={{
                          position: 'absolute',
                          top: '70%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <h4 className="mb-0">{sensorData.dht11.humidity}%</h4>
                          <small className="text-muted">Current</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} lg={6}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="p-3 rounded-circle bg-warning text-white">
                          <FaSun size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0">Light</h5>
                          <small className="text-muted">
                            Current: {sensorData.ldr.light} lux | Threshold: {medicine.lightThreshold} lux
                          </small>
                        </div>
                        {sensorData.ldr.light > medicine.lightThreshold ? (
                          <Badge bg="danger" className="ms-auto">
                            <FaExclamationTriangle className="me-1" />
                            Unsafe
                          </Badge>
                        ) : (
                          <Badge bg="success" className="ms-auto">
                            <FaCheckCircle className="me-1" />
                            Safe
                          </Badge>
                        )}
                      </Stack>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <Doughnut data={lightChartData} options={gaugeOptions} />
                        <div style={{
                          position: 'absolute',
                          top: '70%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <h4 className="mb-0">{sensorData.ldr.light} lux</h4>
                          <small className="text-muted">Current</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} lg={6}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="p-3 rounded-circle bg-success text-white">
                          <FaWind size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0">Gas</h5>
                          <small className="text-muted">
                            Current: {sensorData.mq2.gas} ppm | Threshold: {medicine.gasThreshold} ppm
                          </small>
                        </div>
                        {sensorData.mq2.gas > medicine.gasThreshold ? (
                          <Badge bg="danger" className="ms-auto">
                            <FaExclamationTriangle className="me-1" />
                            Unsafe
                          </Badge>
                        ) : (
                          <Badge bg="success" className="ms-auto">
                            <FaCheckCircle className="me-1" />
                            Safe
                          </Badge>
                        )}
                      </Stack>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <Doughnut data={gasChartData} options={gaugeOptions} />
                        <div style={{
                          position: 'absolute',
                          top: '70%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <h4 className="mb-0">{sensorData.mq2.gas} ppm</h4>
                          <small className="text-muted">Current</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Summary Card - Remains unchanged */}
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5 className="mb-3">Storage Condition Summary</h5>
                  <Row>
                    {[
                      { 
                        name: 'Temperature', 
                        current: sensorData.dht11.temperature, 
                        threshold: medicine.temperatureThreshold,
                        unit: '°C',
                        icon: <FaThermometerHalf className="text-danger" />
                      },
                      { 
                        name: 'Humidity', 
                        current: sensorData.dht11.humidity, 
                        threshold: medicine.humidityThreshold,
                        unit: '%',
                        icon: <FaTint className="text-info" />
                      },
                      { 
                        name: 'Light', 
                        current: sensorData.ldr.light, 
                        threshold: medicine.lightThreshold,
                        unit: 'lux',
                        icon: <FaSun className="text-warning" />
                      },
                      { 
                        name: 'Gas', 
                        current: sensorData.mq2.gas, 
                        threshold: medicine.gasThreshold,
                        unit: 'ppm',
                        icon: <FaWind className="text-success" />
                      }
                    ].map((item, index) => (
                      <Col key={index} xs={12} md={6} lg={3} className="mb-3 mb-lg-0">
                        <Stack direction="horizontal" gap={3}>
                          <div className="fs-4">
                            {item.icon}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{item.name}</h6>
                            <ProgressBar 
                              variant={
                                item.current > item.threshold ? 'danger' : 
                                item.current > item.threshold * 0.8 ? 'warning' : 'success'
                              }
                              now={Math.min(item.current, item.threshold * 1.2)}
                              max={item.threshold * 1.2}
                              label={`${item.current}${item.unit}`}
                            />
                            <small className="text-muted">
                              Threshold: {item.threshold}{item.unit}
                            </small>
                          </div>
                        </Stack>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </>
          ) : (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <div className="mb-4">
                  <FaPills size={48} className="text-primary" />
                </div>
                <h4 className="mb-3">No Data Available</h4>
                <p className="text-muted mb-4">
                  Unable to load medicine details or sensor data
                </p>
              </Card.Body>
            </Card>
          )}
        </main>
       

      </Container>
      <div className="d-flex flex-column justify-content-end" id='motion'>
  <MotionState />
</div>
    </div>
    
  );
}