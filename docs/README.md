# MYQL WIFI - Complete WiFi E-Commerce & SMS Integration System

A comprehensive web application that serves as a WiFi hotspot payment gateway with direct Airtel and MTN Mobile Money API integration and automated voucher delivery via SMS.

## Features

### Core Functionality
- **Direct Mobile Money Integration**: Airtel Money and MTN Mobile Money API integration
- **USSD Push Payments**: Real-time payment processing with customer authorization
- **Automated Voucher Generation**: TP-Link Omada controller integration
- **SMS Notifications**: Africa's Talking SMS API for voucher delivery
- **Multi-Router Management**: Support for multiple WiFi locations
- **Admin Dashboard**: Supreme admin and subordinate admin roles

### Packages
- Daily: UGX 1,000 (24 hours)
- 3 Days: UGX 2,500 (72 hours)
- Weekly: UGX 5,000 (168 hours)
- Monthly: UGX 20,000 (720 hours)

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MySQL** database with connection pooling
- **JWT** authentication with role-based access control
- **Winston** logging system
- **Helmet** security middleware
- **Rate limiting** and input validation

### Frontend
- **React.js** with modern hooks
- **React Router** for navigation
- **Bootstrap 5** for responsive design
- **Axios** for API communication
- **Mobile-first** design approach

### APIs Integrated
- **Airtel Money API**: Collections and Disbursements
- **MTN Mobile Money API**: Collections and Disbursements
- **Africa's Talking SMS API**: Voucher delivery
- **TP-Link Omada API**: Voucher management

## Project Structure

```
myql-wifi/
├── backend/                 # Node.js backend
│   ├── controllers/         # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   └── app.js              # Main application file
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Frontend utilities
│   └── public/             # Static assets
├── database/                # Database files
│   └── schema.sql          # Database schema
├── scripts/                 # Deployment scripts
├── docs/                    # Documentation
└── README.md               # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myql-wifi
   ```

2. **Setup backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure environment variables**
   Edit `.env` file with your actual API keys and configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=myql_wifi

   # JWT
   JWT_SECRET=your_jwt_secret

   # API Keys (get from respective providers)
   AIRTEL_API_KEY=your_airtel_key
   MTN_API_KEY=your_mtn_key
   AT_USERNAME=your_africas_talking_username
   AT_API_KEY=your_africas_talking_key
   ```

4. **Setup database**
   ```sql
   mysql -u root -p < ../database/schema.sql
   ```

5. **Start backend**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Setup frontend**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Configure API URL** (if needed)
   Edit `src/services/api.js` to point to your backend URL.

3. **Start frontend**
   ```bash
   npm start
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/status/:transactionId` - Check payment status

### Admin Endpoints (Protected)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/routers` - List routers
- `POST /api/admin/routers` - Add router
- `GET /api/admin/packages` - List packages
- `GET /api/admin/payments` - Payment history
- `GET /api/admin/sms/logs` - SMS logs

### User Management (Supreme Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Deployment

### Windows Deployment
Run the Windows deployment script:
```bash
scripts/deploy-windows.bat
```

### macOS Deployment
Run the macOS deployment script:
```bash
chmod +x scripts/deploy-macos.sh
./scripts/deploy-macos.sh
```

### Production Deployment
For production deployment on Ubuntu with Nginx:

1. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx mysql-server
   ```

2. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start backend/app.js --name "myql-wifi"
   pm2 startup
   pm2 save
   ```

## Security Features

- **HTTPS/SSL encryption**
- **JWT token authentication**
- **Role-based access control**
- **Rate limiting**
- **Input validation and sanitization**
- **SQL injection prevention**
- **XSS protection**
- **CORS configuration**

## Default Credentials

**Supreme Admin:**
- Username: `supreme_admin`
- Password: `password`

## API Integration Setup

### Airtel Money API
1. Register at Airtel Developer Portal
2. Get API key and secret
3. Configure Collections and Disbursements APIs
4. Set callback URLs in `.env`

### MTN Mobile Money API
1. Register at MTN Developer Portal
2. Create API user and get keys
3. Configure Collection and Disbursement APIs
4. Set callback URLs in `.env`

### Africa's Talking SMS
1. Register at Africa's Talking
2. Get username and API key
3. Configure SMS service
4. Add phone number for testing

### TP-Link Omada
1. Access your Omada controller
2. Create API user with appropriate permissions
3. Get controller URL and credentials
4. Configure in router settings

## Monitoring & Maintenance

### Windows Monitoring
- Windows Performance Monitor
- Windows Event Viewer
- IIS Logs (if using IIS)
- SQL Server Profiler

### Linux Monitoring
- PM2 process monitoring
- Nginx access logs
- MySQL slow query logs
- System resource monitoring

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **API authentication failed**
   - Check API keys in `.env`
   - Verify API endpoints are correct
   - Check network connectivity

3. **Payment callbacks not working**
   - Ensure callback URLs are publicly accessible
   - Check firewall settings
   - Verify SSL certificates

4. **SMS not sending**
   - Check Africa's Talking balance
   - Verify phone number format
   - Check SMS API credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Email: admin@myqlwifi.com
- Phone: +256 700 000 000

## Version History

- **v1.0.0** - Initial release with core functionality
  - Mobile money integration
  - Voucher management
  - Admin dashboard
  - SMS notifications