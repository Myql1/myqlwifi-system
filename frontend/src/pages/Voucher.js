import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaWifi, FaCopy, FaCheckCircle, FaClock, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';

const Voucher = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
    // Poll for status updates every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [transactionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/status/${transactionId}`);
      setPaymentStatus(response.data);

      // Stop polling if payment is completed or failed
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Failed to check payment status');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading && !paymentStatus) {
    return (
      <div className="wifi-bg d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="light" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wifi-bg min-vh-100 py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="card-shadow text-center">
                <Card.Body className="p-5">
                  <Alert variant="danger">
                    {error}
                  </Alert>
                  <Button variant="outline-primary" onClick={() => navigate('/')}>
                    <FaArrowLeft className="me-2" />
                    Back to Home
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
              Back to Home
            </Button>

            <Card className="card-shadow">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <FaWifi size={40} className="text-primary-custom mb-3" />
                  <h2>WiFi Voucher</h2>
                  <p className="text-muted">Your payment and voucher details</p>
                </div>

                {/* Payment Status */}
                <div className="mb-4 text-center">
                  <h5>Payment Status</h5>
                  {getStatusBadge(paymentStatus?.status)}
                  <div className="mt-2">
                    <small className="text-muted">
                      Transaction ID: {paymentStatus?.transaction_id}
                    </small>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-light p-3 rounded mb-4">
                  <h6>Payment Details</h6>
                  <Row>
                    <Col sm={6}>
                      <small className="text-muted">Package</small>
                      <div>{paymentStatus?.package_name}</div>
                    </Col>
                    <Col sm={6}>
                      <small className="text-muted">Amount</small>
                      <div>UGX {paymentStatus?.amount?.toLocaleString()}</div>
                    </Col>
                  </Row>
                </div>

                {/* Voucher Code - Only show if payment is completed */}
                {paymentStatus?.status === 'completed' ? (
                  <div className="text-center mb-4">
                    <h4 className="mb-3">Your Voucher Code</h4>
                    <Card className="bg-primary-custom text-white mb-3">
                      <Card.Body className="py-4">
                        <h2 className="mb-0 font-monospace">
                          {/* For demo purposes, show a placeholder. In real app, this would come from API */}
                          WIFI-DEMO-1234
                        </h2>
                      </Card.Body>
                    </Card>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => copyToClipboard('WIFI-DEMO-1234')}
                      className="mb-3"
                    >
                      {copied ? (
                        <>
                          <FaCheckCircle className="me-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="me-2" />
                          Copy Code
                        </>
                      )}
                    </Button>

                    <Alert variant="info" className="text-start">
                      <h6><FaWifi className="me-2" />How to Connect:</h6>
                      <ol className="mb-0 small">
                        <li>Connect to MYQL WIFI network</li>
                        <li>Open your browser and enter the voucher code above</li>
                        <li>Enjoy your WiFi access!</li>
                      </ol>
                    </Alert>

                    <div className="mt-3">
                      <small className="text-muted">
                        <FaClock className="me-1" />
                        Voucher is valid for {paymentStatus?.duration_hours || 24} hours from activation
                      </small>
                    </div>
                  </div>
                ) : paymentStatus?.status === 'pending' ? (
                  <Alert variant="warning" className="text-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Waiting for payment confirmation. This may take a few moments...
                  </Alert>
                ) : paymentStatus?.status === 'failed' ? (
                  <Alert variant="danger" className="text-center">
                    Payment failed. Please try again or contact support.
                  </Alert>
                ) : null}

                {/* Actions */}
                <div className="text-center">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/')}
                    className="me-2"
                  >
                    Buy Another Package
                  </Button>
                  {paymentStatus?.status === 'completed' && (
                    <Button variant="primary" onClick={() => window.print()}>
                      Print Voucher
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Voucher;