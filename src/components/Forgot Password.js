import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

async function handleSubmit(e) {
  e.preventDefault();
  
  if (!email) {
    toast.error('Please enter your email');
    return;
  }

  try {
    setLoading(true);
    
    // Always show success message (security best practice)
    await resetPassword(email);
    toast.success(
      <div>
        <p>If an account exists for {email}, you'll receive a password reset link.</p>
        <p className="small">Check your spam folder if you don't see it.</p>
      </div>,
      { autoClose: 8000 }
    );
    
    setTimeout(() => navigate('/login'), 3000);
  } catch (error) {
    // Only show errors that don't reveal email existence
    if (error.code === 'auth/invalid-email') {
      toast.error('Please enter a valid email address');
    } else if (error.code === 'auth/too-many-requests') {
      toast.error('Too many attempts. Try again later');
    } else {
      // Generic error message
      toast.error('Error sending reset email. Please try again.');
      console.error('Password reset error:', error);
    }
  } finally {
    setLoading(false);
  }
}
  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <ToastContainer position="top-center" autoClose={5000} />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-sm border-0">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">Reset Password</h2>
                    <p className="text-muted">Enter your email to receive a reset link</p>
                  </div>

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope className="text-muted" />
                        </span>
                        <Form.Control
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </Form.Group>

                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 py-2 fw-bold"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : 'Send Reset Link'}
                      </Button>
                    </motion.div>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-muted">
                      Remember your password?{' '}
                      <Link to="/login" className="text-decoration-none fw-bold">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}