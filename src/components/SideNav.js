import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Nav, Navbar, Offcanvas, Button, 
  Image, Container, Badge, Stack
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { 
  FaUserCircle, FaSignOutAlt, FaBars, 
  FaHome, FaMapMarkedAlt, FaChartBar,
  FaHeartbeat, FaBell
} from 'react-icons/fa';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function SideNav() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('checking');
  const [alertActive, setAlertActive] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(`Failed to logout: ${error.message}`);
    }
  };

  // Monitor device status and alerts
  useEffect(() => {
    const docRef = doc(db, "sensorData", "latest");
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDeviceStatus('connected');
        const data = docSnap.data();
        setAlertActive(data.alert?.active || false);
      } else {
        setDeviceStatus('disconnected');
      }
    }, (error) => {
      console.error("Firebase error:", error);
      setDeviceStatus('error');
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { 
      path: '/dashboard', 
      icon: <FaHome size={20} />, 
      label: 'Dashboard', 
      eventKey: 'dashboard',
      description: 'Overview & monitoring'
    },
    { 
      path: '/select-medicine', 
      icon: <FaChartBar size={20} />, 
      label: 'Medicine List', 
      eventKey: 'medicines',
      description: 'View reminders'
    },
    { 
      path: '/track-device', 
      icon: <FaMapMarkedAlt size={20} />, 
      label: 'Track Location', 
      eventKey: 'track',
      description: 'GPS tracking'
    }
  ];

  const NavItem = ({ item, onClick }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Nav.Link 
        onClick={() => {
          navigate(item.path);
          if (onClick) onClick();
        }}
        className={`text-white mb-2 rounded-3 position-relative ${isActive ? 'bg-white bg-opacity-25' : ''}`}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          padding: '12px 16px'
        }}
      >
        <Stack direction="horizontal" gap={3}>
          <span className="fs-5">{item.icon}</span>
          <div className="flex-grow-1">
            <div className="fw-semibold">{item.label}</div>
            <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
              {item.description}
            </small>
          </div>
          {isActive && (
            <div 
              className="position-absolute top-50 end-0 translate-middle-y bg-white rounded-start"
              style={{ width: '4px', height: '70%' }}
            />
          )}
        </Stack>
      </Nav.Link>
    );
  };

  const StatusBadge = () => {
    const statusConfig = {
      connected: { bg: 'success', text: 'Online', icon: '🟢' },
      disconnected: { bg: 'danger', text: 'Offline', icon: '🔴' },
      checking: { bg: 'warning', text: 'Checking...', icon: '🟡' },
      error: { bg: 'danger', text: 'Error', icon: '⚠️' }
    };

    const config = statusConfig[deviceStatus] || statusConfig.checking;

    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-2 py-2 px-3">
        <span>{config.icon}</span>
        <span>Device: {config.text}</span>
      </Badge>
    );
  };

  const UserProfile = () => (
    <div className="text-center">
      {currentUser.photoURL ? (
        <Image 
          src={currentUser.photoURL} 
          roundedCircle 
          width={80} 
          height={80} 
          className="mb-3 border border-3 border-white shadow" 
          alt="User profile"
        />
      ) : (
        <div className="mb-3">
          <FaUserCircle size={80} className="text-white opacity-75" />
        </div>
      )}
      <h5 className="mb-1 text-white fw-bold">
        {currentUser.displayName || currentUser.email.split('@')[0]}
      </h5>
      <small className="text-white-50 d-block mb-3">{currentUser.email}</small>
      <StatusBadge />
      {alertActive && (
        <Badge bg="danger" className="d-block mt-2 py-2 animate-pulse">
          <FaBell className="me-2" />
          Alert Active
        </Badge>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.15) !important;
          }
        `}
      </style>

      {/* Mobile Navbar - Fixed at top */}
      <Navbar 
        bg="primary" 
        variant="dark" 
        expand="lg" 
        className="d-lg-none fixed-top shadow"
        style={{ zIndex: 1030 }}
      >
        <Container fluid>
          <Button 
            variant="link" 
            onClick={handleShow} 
            className="text-white p-0 border-0"
            aria-label="Open menu"
          >
            <FaBars size={24} />
          </Button>
          <Navbar.Brand className="mx-auto fw-bold">
            <FaHeartbeat className="me-2" />
            Elderly Monitor
          </Navbar.Brand>
          {alertActive && (
            <Badge bg="danger" className="animate-pulse">
              <FaBell />
            </Badge>
          )}
        </Container>
      </Navbar>

      {/* Desktop Sidebar */}
      <div 
        className="d-none d-lg-block" 
        style={{ 
          width: '280px', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0, 
          zIndex: 1000 
        }}
      >
        <div className="bg-primary text-white h-100 d-flex flex-column shadow-lg">
          {/* Header */}
          <div className="p-4 text-center border-bottom border-white border-opacity-25">
            <h4 className="mb-0 fw-bold">
              <FaHeartbeat className="me-2" />
              Elderly Monitor
            </h4>
            <small className="text-white-50">Health & Safety System</small>
          </div>
          
          {/* User Profile */}
          <div className="p-4 border-bottom border-white border-opacity-25">
            <UserProfile />
          </div>
          
          {/* Navigation */}
          <Nav className="flex-column p-3 flex-grow-1">
            <small className="text-white-50 mb-2 px-3">MENU</small>
            {navItems.map((item) => (
              <NavItem key={item.eventKey} item={item} />
            ))}
          </Nav>
          
          {/* Logout */}
          <div className="p-3 border-top border-white border-opacity-25">
            <Button 
              variant="outline-light" 
              className="w-100 rounded-3 py-2"
              onClick={handleLogout}
            >
              <Stack direction="horizontal" gap={3} className="justify-content-center">
                <FaSignOutAlt size={18} />
                <span className="fw-semibold">Logout</span>
              </Stack>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        className="bg-primary text-white"
        placement="start"
      >
        <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-white border-opacity-25">
          <Offcanvas.Title className="fw-bold">
            <FaHeartbeat className="me-2" />
            Elderly Monitor
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {/* User Profile */}
          <div className="mb-4 pb-4 border-bottom border-white border-opacity-25">
            <UserProfile />
          </div>
          
          {/* Navigation */}
          <Nav className="flex-column mb-3 flex-grow-1">
            <small className="text-white-50 mb-2 px-3">MENU</small>
            {navItems.map((item) => (
              <NavItem key={item.eventKey} item={item} onClick={handleClose} />
            ))}
          </Nav>
          
          {/* Logout Button - Pushed to bottom */}
          <div className="pt-3 border-top border-white border-opacity-25">
            <Button 
              variant="outline-light" 
              className="w-100 rounded-3 py-2"
              onClick={handleLogout}
            >
              <Stack direction="horizontal" gap={3} className="justify-content-center">
                <FaSignOutAlt size={18} />
                <span className="fw-semibold">Logout</span>
              </Stack>
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}