import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPackage } = location.state || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  if (!selectedPackage) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber || !provider) {
      setError('Please fill in all fields');
      return;
    }

    // Basic phone number validation for Uganda
    const phoneRegex = /^(\+256|256|0)[173256789]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid Ugandan phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/payments/initiate', {
        phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+256${phoneNumber.replace(/^0/, '')}`,
        packageId: selectedPackage.id,
        provider: provider.toLowerCase()
      });

      setTransactionId(response.data.transaction_id);
      setSuccess(true);

      // Redirect to voucher page after a delay
      setTimeout(() => {
        navigate(`/voucher/${response.data.transaction_id}`);
      }, 3000);

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const numeric = value.replace(/\D/g, '');

    // Format as Ugandan number
    if (numeric.startsWith('256')) {
      return '+' + numeric;
    } else if (numeric.startsWith('0')) {
      return '+256' + numeric.substring(1);
    } else {
      return '+' + numeric;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (success && transactionId) {
    return (
      <div className="wifi-bg d-flex align-items-center justify-content-center min-vh-100">
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="card-shadow text-center">
                <Card.Body className="p-5">
                  <FaCheckCircle size={60} className="text-success mb-4" />
                  <h3 className="mb-3">Payment Initiated!</h3>
                  <p className="text-muted mb-4">
                    Please check your phone for the USSD prompt and approve the payment.
                  </p>
                  <div className="mb-4">
                    <strong>Transaction ID:</strong> {transactionId}
                  </div>
                  <p className="small text-muted">
                    Redirecting to voucher page in a few seconds...
                  </p>
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate(`/voucher/${transactionId}`)}
                  >
                    View Voucher Now
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="wifi-bg min-vh-100 py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            {/* Back Button */}
            <Button
              variant="outline-light"
              className="mb-4"
              onClick={() => navigate('/')}
            >
              <FaArrowLeft className="me-2" />
              Back to Packages
            </Button>

            <Card className="card-shadow">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <FaMobileAlt size={40} className="text-primary-custom mb-3" />
                  <h2>Complete Your Payment</h2>
                  <p className="text-muted">Secure mobile money payment</p>
                </div>

                {/* Package Summary */}
                <div className="bg-light p-3 rounded mb-4">
                  <h5>Package Summary</h5>
                  <div className="d-flex justify-content-between">
                    <span>{selectedPackage.name} ({selectedPackage.duration_hours} hours)</span>
                    <strong>UGX {selectedPackage.price_ugx.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  {/* Phone Number */}
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="+256700000000"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      required
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      Enter your Airtel or MTN phone number
                    </Form.Text>
                  </Form.Group>

                  {/* Provider Selection */}
                  <Form.Group className="mb-4">
                    <Form.Label>Mobile Money Provider</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        label="Airtel Money"
                        name="provider"
                        value="airtel"
                        checked={provider === 'airtel'}
                        onChange={(e) => setProvider(e.target.value)}
                        disabled={loading}
                      />
                      <Form.Check
                        type="radio"
                        label="MTN Mobile Money"
                        name="provider"
                        value="mtn"
                        checked={provider === 'mtn'}
                        onChange={(e) => setProvider(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="btn-wifi w-100"
                    disabled={loading || !phoneNumber || !provider}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      `Pay UGX ${selectedPackage.price_ugx.toLocaleString()}`
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="small text-muted">
                    By proceeding, you agree to our terms and conditions.
                    Payment is processed securely via mobile money.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Payment;