@echo off
echo ========================================
echo MYQL WIFI Deployment Script (Windows)
echo ========================================

echo Installing Node.js...
choco install nodejs -y

echo Installing project dependencies...
cd backend
npm install

echo Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your actual configuration values
)

echo Setting up database...
echo Please ensure MySQL is running and create the database manually
echo Run the following SQL script: database/schema.sql

echo Starting the application...
npm start

echo ========================================
echo Deployment completed!
echo Access the application at: http://localhost:3000
echo Admin login at: http://localhost:3000/admin/login
echo ========================================