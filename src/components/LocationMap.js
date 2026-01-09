import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, Spinner, Alert, Row, Col, Badge, Container, Button } from 'react-bootstrap';
import { 
  FaMapMarkerAlt, FaSatelliteDish, 
  FaExclamationTriangle, FaClock, FaSync
} from 'react-icons/fa';
import SideNav from './SideNav';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to update map center when location changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lng && lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  
  return null;
}

const LocationMap = () => {
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('searching');
  const mapRef = useRef(null);

  // Custom device icon (red pin)
  const deviceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Extract GPS coordinates from various possible Firebase structures
  const extractGPSCoordinates = (data) => {
    console.log("🔍 Raw Firebase data:", data);
    
    // Try different possible field structures
    const structures = [
      // Structure 1: Direct fields (flat structure)
      () => ({
        lat: data.latitude || data.lat || data.gps?.latitude || data.gps?.lat,
        lng: data.longitude || data.lng || data.gps?.longitude || data.gps?.lng
      }),
      
      // Structure 2: Nested with fields.mapValue
      () => ({
        lat: data.fields?.gps?.mapValue?.fields?.latitude?.doubleValue ||
             data.fields?.gps?.mapValue?.fields?.lat?.doubleValue ||
             data.fields?.neo6m?.mapValue?.fields?.latitude?.doubleValue ||
             data.fields?.neo6m?.mapValue?.fields?.lat?.doubleValue,
        lng: data.fields?.gps?.mapValue?.fields?.longitude?.doubleValue ||
             data.fields?.gps?.mapValue?.fields?.lng?.doubleValue ||
             data.fields?.neo6m?.mapValue?.fields?.longitude?.doubleValue ||
             data.fields?.neo6m?.mapValue?.fields?.lng?.doubleValue
      }),
      
      // Structure 3: Mixed direct access
      () => ({
        lat: data.fields?.latitude?.doubleValue ||
             data.fields?.lat?.doubleValue,
        lng: data.fields?.longitude?.doubleValue ||
             data.fields?.lng?.doubleValue
      })
    ];

    for (const getCoords of structures) {
      const coords = getCoords();
      console.log("📍 Trying structure:", coords);
      
      if (coords.lat && coords.lng && 
          coords.lat !== 0 && coords.lng !== 0 &&
          coords.lat !== 11.15 && coords.lng !== 7.65) { // Default values from ESP32
        console.log("✅ GPS coordinates found:", coords);
        return {
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lng)
        };
      }
    }
    
    console.log("❌ No valid GPS coordinates found in any structure");
    return null;
  };

  // Listen to Firebase device location in real-time
  useEffect(() => {
    const docRef = doc(db, "sensorData", "latest");
    
    console.log("📡 Connecting to Firebase document: sensorData/latest");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📦 Document exists, parsing data...");
        
        const gpsData = extractGPSCoordinates(data);
        
        if (gpsData) {
          console.log(`✅ GPS Coordinates: ${gpsData.latitude}, ${gpsData.longitude}`);
          
          const location = {
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            timestamp: new Date()
          };
          
          setDeviceLocation(location);
          setLastUpdate(new Date());
          setLoading(false);
          setError(null);
          setGpsStatus('active');
          
          // Log the coordinates in different formats
          console.log(`📍 Location set: ${location.lat}, ${location.lng}`);
          console.log(`🌐 Google Maps: https://www.google.com/maps?q=${location.lat},${location.lng}`);
          console.log(`🗺️ OpenStreetMap: https://www.openstreetmap.org/#map=15/${location.lat}/${location.lng}`);
        } else {
          console.log("⚠️ GPS data is still default values or invalid");
          setGpsStatus('searching');
          setError('GPS module is acquiring satellite fix...');
          setLoading(false);
          
          // Show last known location if available
          if (!deviceLocation) {
            setError('Waiting for GPS signal. Make sure device is outdoors with clear sky view.');
          }
        }
      } else {
        console.log("❌ Document 'sensorData/latest' does not exist");
        setError('No sensor data found. Check if ESP32 is sending data.');
        setLoading(false);
      }
    }, (error) => {
      console.error("🔥 Firebase error:", error);
      setError(`Firebase connection error: ${error.message}`);
      setLoading(false);
      setGpsStatus('error');
    });
  
    return () => unsubscribe();
  }, [refresh, deviceLocation]);

  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
    setLoading(true);
    console.log("🔄 Manually refreshing GPS data...");
  };

  const formatCoordinate = (coord, isLat) => {
    if (!coord) return 'N/A';
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const getMapUrl = () => {
    if (!deviceLocation) return '#';
    return `https://www.google.com/maps?q=${deviceLocation.lat},${deviceLocation.lng}`;
  };

  const getOpenStreetMapUrl = () => {
    if (!deviceLocation) return '#';
    return `https://www.openstreetmap.org/#map=15/${deviceLocation.lat}/${deviceLocation.lng}`;
  };

  return (
    <Container fluid className="px-0">
      <SideNav />
      
      {/* Mobile spacing */}
      <div className="d-lg-none" style={{ height: '56px' }}></div>

      <main className="px-3 px-lg-4 py-4" style={{ marginLeft: '0' }}>
        <style>
          {`
            @media (min-width: 992px) {
              main {
                margin-left: 280px !important;
              }
            }
            .leaflet-container {
              font-family: inherit;
              z-index: 1;
            }
            @keyframes pulse-ring {
              0% {
                transform: scale(0.8);
                opacity: 1;
              }
              100% {
                transform: scale(2.5);
                opacity: 0;
              }
            }
            .pulse-marker {
              animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
            }
            .map-container {
              position: relative;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .gps-status-badge {
              font-size: 0.85rem;
              padding: 4px 10px;
            }
          `}
        </style>

        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold">
              <FaSatelliteDish className="me-2 text-primary" />
              Real-Time GPS Tracking
            </h2>
            <p className="text-muted">NEO-6M GPS Module Location Monitoring</p>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Badge bg={gpsStatus === 'active' ? 'success' : 
                        gpsStatus === 'searching' ? 'warning' : 'danger'} 
                     className="fs-6 px-3 py-2 d-flex align-items-center">
                <span className={`spinner-${gpsStatus === 'searching' ? 'border' : 'grow'} 
                                spinner-${gpsStatus === 'searching' ? 'border' : 'grow'}-sm me-2`}></span>
                {gpsStatus === 'active' ? 'Live Tracking' : 
                 gpsStatus === 'searching' ? 'Acquiring Signal' : 'GPS Error'}
              </Badge>
              <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                <FaSync className="me-1" /> Refresh
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant={gpsStatus === 'searching' ? 'warning' : 'danger'} 
                   className="d-flex align-items-center shadow-sm">
              <FaExclamationTriangle className="me-2 fs-4" />
              <div className="flex-grow-1">
                <strong>GPS Status:</strong> {error}
                <div className="mt-2">
                  <small className="d-block">
                    📍 Check if device has clear sky view (outdoors or near window)
                  </small>
                  <small className="d-block">
                    ⏱️ First GPS fix can take 30-60 seconds after power on
                  </small>
                  <small className="d-block">
                    📡 Make sure NEO-6M module antenna is properly connected
                  </small>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

        {loading ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 mb-1">Connecting to device GPS...</p>
              <small className="text-muted">Fetching location from sensorData/latest</small>
              <div className="mt-4">
                <Badge bg="info" className="gps-status-badge me-2">📡 Listening to Firebase</Badge>
                <Badge bg="info" className="gps-status-badge me-2">🛰️ Checking GPS data</Badge>
                <Badge bg="info" className="gps-status-badge">🗺️ Preparing map</Badge>
              </div>
            </Card.Body>
          </Card>
        ) : !deviceLocation ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5">
              <FaSatelliteDish size={64} className="text-warning mb-3" />
              <h4 className="mb-3">Waiting for GPS Signal</h4>
              <p className="text-muted mb-4">
                The GPS module needs clear view of the sky to get satellite fix.
              </p>
              
              <div className="bg-light p-4 rounded mb-4 text-start" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h6 className="fw-bold mb-3">🔧 GPS Module Troubleshooting:</h6>
                <ul className="text-muted">
                  <li className="mb-2">
                    <strong>Location:</strong> Move the ESP32 device outdoors or near a window
                  </li>
                  <li className="mb-2">
                    <strong>Satellites:</strong> GPS needs at least 4 satellites for accurate fix
                  </li>
                  <li className="mb-2">
                    <strong>Time:</strong> Cold start can take 30-60 seconds for first fix
                  </li>
                  <li className="mb-2">
                    <strong>Antenna:</strong> Ensure GPS antenna is properly connected and facing up
                  </li>
                  <li className="mb-2">
                    <strong>Power:</strong> GPS module needs stable power supply (3.3V)
                  </li>
                  <li>
                    <strong>Serial Monitor:</strong> Check ESP32 serial output for GPS data
                  </li>
                </ul>
              </div>
              
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button variant="warning" onClick={handleRefresh}>
                  <FaSync className="me-2" />
                  Retry GPS Connection
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Device Location Card */}
            <Row className="g-4 mb-4">
              <Col lg={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-sm border-success border-3">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={8}>
                          <div className="d-flex align-items-center mb-3">
                            <div className="p-3 rounded-circle bg-success text-white me-3">
                              <FaMapMarkerAlt size={32} />
                            </div>
                            <div>
                              <h4 className="mb-1 fw-bold">📍 Device GPS Location</h4>
                              <p className="text-muted mb-0">
                                NEO-6M Module | Real-time coordinates
                              </p>
                            </div>
                          </div>
                          
                          <Row>
                            <Col sm={6}>
                              <Card className="mb-3">
                                <Card.Body>
                                  <small className="text-muted d-block mb-1">Latitude</small>
                                  <h3 className="mb-0 text-success fw-bold">
                                    {formatCoordinate(deviceLocation.lat, true)}
                                  </h3>
                                  <small className="text-muted">
                                    Decimal: {deviceLocation.lat.toFixed(6)}°
                                  </small>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col sm={6}>
                              <Card className="mb-3">
                                <Card.Body>
                                  <small className="text-muted d-block mb-1">Longitude</small>
                                  <h3 className="mb-0 text-success fw-bold">
                                    {formatCoordinate(deviceLocation.lng, false)}
                                  </h3>
                                  <small className="text-muted">
                                    Decimal: {deviceLocation.lng.toFixed(6)}°
                                  </small>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                          
                          <div className="d-flex gap-2 mt-3">
                            <a href={getMapUrl()} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="btn btn-primary">
                              <FaMapMarkerAlt className="me-2" />
                              Open in Google Maps
                            </a>
                            <a href={getOpenStreetMapUrl()} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="btn btn-outline-primary">
                              Open in OpenStreetMap
                            </a>
                          </div>
                        </Col>
                        
                        <Col md={4}>
                          <Card className="h-100">
                            <Card.Body className="d-flex flex-column justify-content-center text-center">
                              <FaSatelliteDish size={64} className="text-primary mb-3" />
                              <h5 className="fw-bold text-primary">GPS ACTIVE</h5>
                              <div className="mt-3">
                                <Badge bg="success" className="px-3 py-2 mb-2">
                                  <FaClock className="me-2" />
                                  Last Update
                                </Badge>
                                <p className="fw-bold">
                                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
                                </p>
                                <small className="text-muted">
                                  Updates every 3 seconds from ESP32
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>

            {/* Map Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <div className="map-container" style={{ height: '600px', width: '100%' }}>
                    <MapContainer 
                      center={[deviceLocation.lat, deviceLocation.lng]} 
                      zoom={16} 
                      scrollWheelZoom={true}
                      style={{ height: '100%', width: '100%' }}
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                      />

                      {/* Auto-recenter when location updates */}
                      <RecenterMap lat={deviceLocation.lat} lng={deviceLocation.lng} />

                      {/* Device Marker with pulse effect */}
                      <Marker position={[deviceLocation.lat, deviceLocation.lng]} icon={deviceIcon}>
                        <Popup>
                          <div style={{ minWidth: '250px' }}>
                            <h6 className="fw-bold text-success mb-3">
                              <FaMapMarkerAlt className="me-2" />
                              Device GPS Location
                            </h6>
                            <hr />
                            <div className="mb-2">
                              <strong>Latitude:</strong><br />
                              {formatCoordinate(deviceLocation.lat, true)}
                              <br />
                              <small className="text-muted">
                                {deviceLocation.lat.toFixed(6)}°
                              </small>
                            </div>
                            <div className="mb-2">
                              <strong>Longitude:</strong><br />
                              {formatCoordinate(deviceLocation.lng, false)}
                              <br />
                              <small className="text-muted">
                                {deviceLocation.lng.toFixed(6)}°
                              </small>
                            </div>
                            <hr />
                            <small className="text-muted">
                              <FaClock className="me-1" />
                              <strong>Updated:</strong> {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
                            </small>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>

                    {/* Live indicator */}
                    <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 1000 }}>
                      <Badge bg="success" className="px-3 py-2 shadow d-flex align-items-center">
                        <span className="pulse-marker d-inline-block me-2" style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: 'white' 
                        }}></span>
                        <strong>LIVE GPS TRACKING</strong>
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Info Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-sm mt-4">
                <Card.Body>
                  <Row className="text-center align-items-center">
                    <Col md={3}>
                      <FaSatelliteDish size={28} className="text-primary mb-2" />
                      <h6 className="mb-1 fw-bold">GPS Module</h6>
                      <small className="text-muted">NEO-6M</small>
                    </Col>
                    <Col md={3}>
                      <FaMapMarkerAlt size={28} className="text-success mb-2" />
                      <h6 className="mb-1 fw-bold">Accuracy</h6>
                      <Badge bg="success">±5 meters</Badge>
                    </Col>
                    <Col md={3}>
                      <FaClock size={28} className="text-info mb-2" />
                      <h6 className="mb-1 fw-bold">Update Rate</h6>
                      <small className="text-muted">Every 3 seconds</small>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex justify-content-center mb-2">
                        <span className="spinner-grow text-success" 
                              style={{ width: '32px', height: '32px' }}></span>
                      </div>
                      <h6 className="mb-1 fw-bold">Status</h6>
                      <Badge bg="success" className="px-3">ACTIVE</Badge>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </Container>
  );
};

export default LocationMap;