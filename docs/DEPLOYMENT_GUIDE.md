# MYQL WIFI Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the MYQL WIFI system to various environments including Vercel, Ubuntu server, Windows, and macOS.

## Prerequisites

### System Requirements
- Node.js 16.x or higher
- MySQL 8.x or higher
- Git
- SSL certificate (for production)

### API Accounts Required
1. **Airtel Money API**
   - Register at [Airtel Developer Portal](https://openapi.airtel.africa/)
   - Get API key and secret
   - Configure Collections and Disbursements APIs

2. **MTN Mobile Money API**
   - Register at [MTN Developer Portal](https://momodeveloper.mtn.com/)
   - Create API user and get credentials
   - Configure Collection and Disbursement APIs

3. **Africa's Talking SMS**
   - Register at [Africa's Talking](https://africastalking.com/)
   - Get username and API key
   - Add phone number for testing

4. **TP-Link Omada Controller**
   - Access your Omada SDN Controller
   - Create API user with appropriate permissions

## Environment Configuration

### 1. Clone Repository
```bash
git clone <repository-url>
cd myql-wifi
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
BASE_URL=https://your-domain.com

# Database Configuration
DB_HOST=your-database-host
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=myql_wifi

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Airtel Money API Configuration
AIRTEL_API_KEY=your-airtel-api-key
AIRTEL_API_SECRET=your-airtel-api-secret
AIRTEL_ENVIRONMENT=production

# MTN Mobile Money API Configuration
MTN_API_KEY=your-mtn-api-key
MTN_API_SECRET=your-mtn-api-secret
MTN_ENVIRONMENT=production
MTN_SUBSCRIPTION_KEY=your-mtn-subscription-key

# Africa's Talking SMS Configuration
AT_USERNAME=your-africas-talking-username
AT_API_KEY=your-africas-talking-api-key

# Omada Controller Configuration
OMADA_BASE_URL=https://your-omada-controller.com
OMADA_USERNAME=your-omada-username
OMADA_PASSWORD=your-omada-password

# Business Configuration
BUSINESS_NAME=MYQL WIFI
BUSINESS_PHONE=+256700000000
BUSINESS_EMAIL=admin@myqlwifi.com
```

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account
- External MySQL database (PlanetScale, AWS RDS, or similar)

#### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   vercel --prod
   ```

4. **Deploy Frontend**
   ```bash
   cd ../frontend
   npm run build
   vercel --prod
   ```

5. **Configure Environment Variables**
   In Vercel dashboard, add all environment variables from your `.env` file.

6. **Set up Database**
   - Use a cloud MySQL service like PlanetScale
   - Run the database schema: `database/schema.sql`

#### Vercel Configuration
The `vercel.json` file is already configured for:
- Backend API routes under `/api/*`
- Frontend static files for all other routes
- Serverless function timeout of 30 seconds

### Option 2: Ubuntu Server with Nginx

#### Prerequisites
- Ubuntu 20.04 or higher
- Root or sudo access

#### Steps

1. **Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install MySQL**
   ```bash
   sudo apt install mysql-server -y
   sudo mysql_secure_installation
   ```

4. **Setup Database**
   ```bash
   sudo mysql -u root -p < database/schema.sql
   ```

5. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

6. **Configure Application**
   ```bash
   cd backend
   npm install --production
   ```

7. **Start Application with PM2**
   ```bash
   pm2 start app.js --name "myql-wifi"
   pm2 startup
   pm2 save
   ```

8. **Install and Configure Nginx**
   ```bash
   sudo apt install nginx -y
   ```

   Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/myql-wifi
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   }
   ```

9. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/myql-wifi /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

10. **Install SSL Certificate (Let's Encrypt)**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d your-domain.com
    ```

### Option 3: Windows Server

#### Prerequisites
- Windows Server 2019 or higher
- Administrator access

#### Steps

1. **Install Chocolatey**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
   ```

2. **Install Node.js**
   ```powershell
   choco install nodejs -y
   ```

3. **Install MySQL**
   ```powershell
   choco install mysql -y
   ```

4. **Setup Database**
   ```sql
   mysql -u root -p < database/schema.sql
   ```

5. **Configure Application**
   ```bash
   cd backend
   npm install --production
   ```

6. **Install as Windows Service**
   ```powershell
   npm install -g node-windows
   node scripts/install-service.js
   ```

7. **Configure Firewall**
   ```powershell
   New-NetFirewallRule -DisplayName "MYQL WIFI" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

### Option 4: macOS Server

#### Prerequisites
- macOS 12.0 or higher
- Administrator access

#### Steps

1. **Install Homebrew**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**
   ```bash
   brew install node
   ```

3. **Install MySQL**
   ```bash
   brew install mysql
   brew services start mysql
   mysql_secure_installation
   ```

4. **Setup Database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Configure Application**
   ```bash
   cd backend
   npm install --production
   ```

6. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

7. **Start Application**
   ```bash
   pm2 start app.js --name "myql-wifi"
   pm2 startup
   pm2 save
   ```

## API Configuration

### Airtel Money API Setup

1. **Register Application**
   - Go to Airtel Developer Portal
   - Create new application
   - Select Collections and Disbursements APIs

2. **Configure Webhooks**
   - Collections callback: `https://your-domain.com/api/payments/airtel/callback`
   - Disbursements callback: `https://your-domain.com/api/payments/airtel/disburse-callback`

3. **Get Credentials**
   - API Key and Secret from dashboard
   - Update `.env` file

### MTN Mobile Money API Setup

1. **Create API User**
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
     -H "X-Reference-Id: your-reference-id" \
     -H "Ocp-Apim-Subscription-Key: your-subscription-key" \
     -d '{"providerCallbackHost": "your-domain.com"}'
   ```

2. **Create API Key**
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/your-api-user-id/apikey \
     -H "Ocp-Apim-Subscription-Key: your-subscription-key"
   ```

3. **Configure Webhooks**
   - Callback URL: `https://your-domain.com/api/payments/mtn/callback`

### Africa's Talking SMS Setup

1. **Add Phone Number**
   - Login to Africa's Talking dashboard
   - Go to SMS settings
   - Add and verify your phone number

2. **Configure Callback**
   - Delivery reports URL: `https://your-domain.com/api/sms/delivery-callback`

## Monitoring and Maintenance

### Application Monitoring

#### PM2 (Linux/macOS)
```bash
pm2 monit
pm2 logs myql-wifi
pm2 restart myql-wifi
```

#### Windows Service
```powershell
Get-Service "MYQL WIFI"
Restart-Service "MYQL WIFI"
```

### Database Maintenance

#### Backup Database
```bash
mysqldump -u username -p myql_wifi > backup.sql
```

#### Monitor Database
```sql
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

### Log Monitoring

#### Application Logs
- Backend logs: `backend/logs/`
- PM2 logs: `~/.pm2/logs/`

#### System Logs
- Linux: `/var/log/nginx/`
- Windows: Event Viewer
- macOS: Console app

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL service
   sudo systemctl status mysql  # Linux
   brew services list          # macOS

   # Test connection
   mysql -u username -p -e "SELECT 1"
   ```

2. **Application Won't Start**
   ```bash
   # Check Node.js version
   node --version

   # Check dependencies
   cd backend && npm list --depth=0

   # Check environment variables
   cat .env
   ```

3. **API Calls Failing**
   ```bash
   # Check network connectivity
   curl -I https://openapi.airtel.africa

   # Check API credentials
   grep "API_KEY" .env
   ```

4. **Webhook Not Receiving**
   ```bash
   # Check firewall
   sudo ufw status  # Linux

   # Check SSL certificate
   curl -I https://your-domain.com
   ```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_payments_status ON payments(status);
   CREATE INDEX idx_vouchers_expires_at ON vouchers(expires_at);
   ```

2. **Caching**
   - Implement Redis for session storage
   - Cache package information
   - Cache user authentication

3. **Load Balancing**
   - Use Nginx upstream for multiple app instances
   - Implement Redis for session sharing

## Security Checklist

- [ ] SSL certificate installed and valid
- [ ] Environment variables properly configured
- [ ] Database credentials secure
- [ ] API keys encrypted
- [ ] Firewall configured
- [ ] Regular security updates applied
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

## Support

For deployment issues:
- Check application logs
- Verify environment configuration
- Test API connectivity
- Review firewall settings

Contact: admin@myqlwifi.com