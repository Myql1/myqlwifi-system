import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaWifi, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import api from '../services/api';

const Home = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      // For now, use static packages since we don't have a public endpoint
      const staticPackages = [
        {
          id: 1,
          name: 'Daily',
          duration_hours: 24,
          price_ugx: 1000,
          description: '24 hours WiFi access'
        },
        {
          id: 2,
          name: '3 Days',
          duration_hours: 72,
          price_ugx: 2500,
          description: '3 days WiFi access'
        },
        {
          id: 3,
          name: 'Weekly',
          duration_hours: 168,
          price_ugx: 5000,
          description: '7 days WiFi access'
        },
        {
          id: 4,
          name: 'Monthly',
          duration_hours: 720,
          price_ugx: 20000,
          description: '30 days WiFi access'
        }
      ];
      setPackages(staticPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleProceedToPayment = () => {
    if (selectedPackage) {
      navigate('/payment', { state: { selectedPackage } });
    }
  };

  if (loading) {
    return (
      <div className="wifi-bg d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" variant="light" size="lg" />
      </div>
    );
  }

  return (
    <div className="wifi-bg">
      <Container className="py-5">
        {/* Header */}
        <Row className="text-center mb-5">
          <Col>
            <FaWifi size={60} className="text-white mb-3" />
            <h1 className="display-4 text-white fw-bold">MYQL WIFI</h1>
            <p className="lead text-white-50">Fast, Reliable WiFi Access</p>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Row className="mb-4">
            <Col md={{ span: 6, offset: 3 }}>
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Package Selection */}
        <Row className="mb-5">
          <Col>
            <h2 className="text-white text-center mb-4">Choose Your Package</h2>
            <Row>
              {packages.map((pkg) => (
                <Col md={6} lg={3} key={pkg.id} className="mb-4">
                  <Card
                    className={`package-card card-shadow h-100 ${
                      selectedPackage?.id === pkg.id ? 'package-selected' : ''
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <Card.Body className="text-center p-4">
                      <div className="mb-3">
                        <FaClock size={30} className="text-primary-custom" />
                      </div>
                      <Card.Title className="fw-bold">{pkg.name}</Card.Title>
                      <Card.Text className="text-muted small mb-3">
                        {pkg.description}
                      </Card.Text>
                      <div className="mb-3">
                        <span className="h4 text-primary-custom fw-bold">
                          UGX {pkg.price_ugx.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-muted small">
                        {pkg.duration_hours} hours access
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Proceed Button */}
        {selectedPackage && (
          <Row>
            <Col className="text-center">
              <Card className="card-shadow mx-auto" style={{ maxWidth: '500px' }}>
                <Card.Body className="p-4">
                  <h4 className="mb-3">Selected Package</h4>
                  <div className="mb-3">
                    <strong>{selectedPackage.name}</strong> - UGX {selectedPackage.price_ugx.toLocaleString()}
                  </div>
                  <Button
                    size="lg"
                    className="btn-wifi w-100"
                    onClick={handleProceedToPayment}
                  >
                    <FaMoneyBillWave className="me-2" />
                    Proceed to Payment
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Footer */}
        <Row className="mt-5">
          <Col className="text-center">
            <p className="text-white-50 small">
              Powered by MYQL WIFI • Secure Mobile Money Payments
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;