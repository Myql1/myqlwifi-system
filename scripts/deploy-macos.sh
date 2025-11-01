#!/bin/bash

echo "========================================"
echo "MYQL WIFI Deployment Script (macOS)"
echo "========================================"

echo "Installing Homebrew (if not installed)..."
if ! command -v brew &> /dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "Installing Node.js..."
brew install node

echo "Installing project dependencies..."
cd backend
npm install

echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit .env file with your actual configuration values"
fi

echo "Setting up database..."
echo "Please ensure MySQL is running and create the database manually"
echo "Run the following SQL script: database/schema.sql"

echo "Starting the application..."
npm start

echo "========================================"
echo "Deployment completed!"
echo "Access the application at: http://localhost:3000"
echo "Admin login at: http://localhost:3000/admin/login"
echo "========================================"