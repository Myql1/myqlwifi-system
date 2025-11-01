# MYQL WIFI API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Get Profile
**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

## Payment Endpoints

### Initiate Payment
**Endpoint:** `POST /payments/initiate`

**Request Body:**
```json
{
  "phoneNumber": "+256700000000",
  "packageId": 1,
  "provider": "airtel"
}
```

**Response:**
```json
{
  "transaction_id": "MYQL-1234567890-abc123",
  "status": "pending",
  "amount": 1000,
  "package": "Daily",
  "message": "Payment initiated. Please check your phone for USSD prompt."
}
```

### Check Payment Status
**Endpoint:** `GET /payments/status/:transactionId`

**Response:**
```json
{
  "transaction_id": "MYQL-1234567890-abc123",
  "status": "completed",
  "amount": 1000,
  "package_name": "Daily",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

## Admin Endpoints

All admin endpoints require authentication and admin role.

### Dashboard Statistics
**Endpoint:** `GET /admin/dashboard`

**Response:**
```json
{
  "revenue": {
    "total_revenue": 15000,
    "completed_payments": 5,
    "pending_payments": 2,
    "failed_payments": 1,
    "avg_payment_amount": 3000
  },
  "vouchers": {
    "active_vouchers": 3,
    "used_vouchers": 2,
    "expired_vouchers": 1,
    "total_vouchers": 6
  },
  "sms": {
    "total_sms": 25,
    "sent_sms": 23,
    "delivered_sms": 20,
    "failed_sms": 3
  },
  "routers": {
    "total_routers": 2,
    "active_routers": 2,
    "inactive_routers": 0
  }
}
```

### Router Management

#### List Routers
**Endpoint:** `GET /admin/routers`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Router",
    "location": "Kampala Branch",
    "omada_controller_url": "https://192.168.1.100",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Add Router
**Endpoint:** `POST /admin/routers`

**Request Body:**
```json
{
  "name": "New Router",
  "location": "Branch Location",
  "omada_controller_url": "https://omada-controller.com",
  "omada_username": "admin",
  "omada_password": "password"
}
```

#### Update Router
**Endpoint:** `PUT /admin/routers/:id`

**Request Body:**
```json
{
  "name": "Updated Router Name",
  "location": "Updated Location",
  "is_active": true
}
```

#### Delete Router
**Endpoint:** `DELETE /admin/routers/:id`

#### Test Router Connection
**Endpoint:** `GET /admin/routers/:id/test`

**Response:**
```json
{
  "status": "connected",
  "controller_info": {
    "name": "Omada Controller",
    "version": "5.0.0"
  }
}
```

### Package Management

#### List Packages
**Endpoint:** `GET /admin/packages`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Daily",
    "duration_hours": 24,
    "price_ugx": 1000,
    "description": "24 hours WiFi access",
    "is_active": true
  }
]
```

#### Add Package
**Endpoint:** `POST /admin/packages`

**Request Body:**
```json
{
  "name": "Weekly",
  "duration_hours": 168,
  "price_ugx": 5000,
  "description": "7 days WiFi access"
}
```

#### Update Package
**Endpoint:** `PUT /admin/packages/:id`

**Request Body:**
```json
{
  "name": "Weekly Special",
  "price_ugx": 4500,
  "is_active": true
}
```

#### Delete Package
**Endpoint:** `DELETE /admin/packages/:id`

### Payment Management

#### Get Payments
**Endpoint:** `GET /admin/payments?limit=50&offset=0`

**Response:**
```json
[
  {
    "id": 1,
    "transaction_id": "MYQL-1234567890-abc123",
    "customer_phone": "+256700000000",
    "provider": "airtel",
    "package_name": "Daily",
    "amount": 1000,
    "status": "completed",
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Get Payment Statistics
**Endpoint:** `GET /admin/payments/stats`

**Response:**
```json
{
  "total_revenue": 15000,
  "completed_payments": 5,
  "pending_payments": 2,
  "failed_payments": 1,
  "avg_payment_amount": 3000
}
```

### Voucher Management

#### Get Active Vouchers
**Endpoint:** `GET /admin/vouchers`

**Response:**
```json
[
  {
    "id": 1,
    "code": "WIFI-ABC123",
    "router_name": "Main Router",
    "package_name": "Daily",
    "customer_phone": "+256700000000",
    "status": "active",
    "expires_at": "2023-01-02T00:00:00.000Z"
  }
]
```

#### Get Voucher Statistics
**Endpoint:** `GET /admin/vouchers/stats`

**Response:**
```json
{
  "active_vouchers": 3,
  "used_vouchers": 2,
  "expired_vouchers": 1,
  "total_vouchers": 6
}
```

### SMS Management

#### Get SMS Logs
**Endpoint:** `GET /admin/sms/logs?limit=100&offset=0`

**Response:**
```json
[
  {
    "id": 1,
    "phone": "+256700000000",
    "message": "Your voucher code is WIFI-ABC123...",
    "status": "sent",
    "provider": "africas_talking",
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Get SMS Statistics
**Endpoint:** `GET /admin/sms/stats`

**Response:**
```json
{
  "total_sms": 25,
  "sent_sms": 23,
  "delivered_sms": 20,
  "failed_sms": 3
}
```

#### Check SMS Balance
**Endpoint:** `GET /admin/sms/balance`

**Response:**
```json
{
  "balance": "150.50",
  "currency": "UGX"
}
```

## User Management (Supreme Admin Only)

### List Users
**Endpoint:** `GET /users`

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

### Create User
**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword",
  "role": "admin"
}
```

### Update User
**Endpoint:** `PUT /users/:id`

**Request Body:**
```json
{
  "username": "updatedadmin",
  "email": "updated@example.com",
  "role": "admin",
  "is_active": true
}
```

### Delete User
**Endpoint:** `DELETE /users/:id`

## Error Responses

All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 attempts per 15 minutes per IP

## Data Formats

### Phone Numbers
All phone numbers should be in international format:
- Valid: `+256700000000`
- Invalid: `0700000000`, `256700000000`

### Amounts
All monetary amounts are in Ugandan Shillings (UGX) and should be integers.

### Dates
All dates are returned in ISO 8601 format:
`2023-01-01T00:00:00.000Z`

## Webhook Endpoints

### Airtel Payment Callback
**Endpoint:** `POST /payments/airtel/callback`

**Headers:**
```
Content-Type: application/json
X-Airtel-Signature: <signature>
```

### MTN Payment Callback
**Endpoint:** `POST /payments/mtn/callback`

**Headers:**
```
Content-Type: application/json
```

## Testing

### Test Credentials

**Admin Login:**
- Username: `supreme_admin`
- Password: `password`

### Sample API Calls

Using curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"supreme_admin","password":"password"}'

# Get dashboard (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer TOKEN"
```

### Postman Collection

Import the included `docs/MYQL_WIFI_API.postman_collection.json` file for comprehensive API testing.