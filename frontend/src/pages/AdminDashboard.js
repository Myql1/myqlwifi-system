import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Nav, Tab, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaTachometerAlt, FaUsers, FaWifi, FaCreditCard, FaSms, FaSignOutAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    setUser(JSON.parse(userData));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <div className="bg-primary-custom text-white py-3">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">MYQL WIFI Admin Dashboard</h4>
            </Col>
            <Col xs="auto">
              <span className="me-3">Welcome, {user?.username}</span>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Row>
            <Col sm={3}>
              <Card className="mb-4">
                <Card.Body>
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link eventKey="dashboard">
                        <FaTachometerAlt className="me-2" />
                        Dashboard
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="routers">
                        <FaWifi className="me-2" />
                        Routers
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="packages">
                        <FaCreditCard className="me-2" />
                        Packages
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="payments">
                        <FaCreditCard className="me-2" />
                        Payments
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="sms">
                        <FaSms className="me-2" />
                        SMS Logs
                      </Nav.Link>
                    </Nav.Item>
                    {user?.role === 'supreme_admin' && (
                      <Nav.Item>
                        <Nav.Link eventKey="users">
                          <FaUsers className="me-2" />
                          Users
                        </Nav.Link>
                      </Nav.Item>
                    )}
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={9}>
              <Tab.Content>
                {/* Dashboard Tab */}
                <Tab.Pane eventKey="dashboard">
                  <h3 className="mb-4">Dashboard Overview</h3>
                  <Row>
                    <Col md={3}>
                      <Card className="text-center mb-4">
                        <Card.Body>
                          <h4 className="text-primary-custom">
                            UGX {dashboardData?.revenue?.total_revenue?.toLocaleString() || '0'}
                          </h4>
                          <p className="text-muted mb-0">Total Revenue</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center mb-4">
                        <Card.Body>
                          <h4 className="text-success">
                            {dashboardData?.revenue?.completed_payments || 0}
                          </h4>
                          <p className="text-muted mb-0">Completed Payments</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center mb-4">
                        <Card.Body>
                          <h4 className="text-info">
                            {dashboardData?.vouchers?.active_vouchers || 0}
                          </h4>
                          <p className="text-muted mb-0">Active Vouchers</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center mb-4">
                        <Card.Body>
                          <h4 className="text-warning">
                            {dashboardData?.sms?.total_sms || 0}
                          </h4>
                          <p className="text-muted mb-0">SMS Sent</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* Routers Tab */}
                <Tab.Pane eventKey="routers">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Router Management</h3>
                    <Button variant="primary">
                      <FaPlus className="me-2" />
                      Add Router
                    </Button>
                  </div>
                  <Card>
                    <Card.Body>
                      <p className="text-muted">Router management functionality will be implemented here.</p>
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Packages Tab */}
                <Tab.Pane eventKey="packages">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Package Management</h3>
                    <Button variant="primary">
                      <FaPlus className="me-2" />
                      Add Package
                    </Button>
                  </div>
                  <Card>
                    <Card.Body>
                      <p className="text-muted">Package management functionality will be implemented here.</p>
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Payments Tab */}
                <Tab.Pane eventKey="payments">
                  <h3 className="mb-4">Payment History</h3>
                  <Card>
                    <Card.Body>
                      <p className="text-muted">Payment history will be displayed here.</p>
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* SMS Tab */}
                <Tab.Pane eventKey="sms">
                  <h3 className="mb-4">SMS Logs</h3>
                  <Card>
                    <Card.Body>
                      <p className="text-muted">SMS logs will be displayed here.</p>
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Users Tab (Supreme Admin Only) */}
                {user?.role === 'supreme_admin' && (
                  <Tab.Pane eventKey="users">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3>User Management</h3>
                      <Button variant="primary">
                        <FaPlus className="me-2" />
                        Add User
                      </Button>
                    </div>
                    <Card>
                      <Card.Body>
                        <p className="text-muted">User management functionality will be implemented here.</p>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                )}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default AdminDashboard;