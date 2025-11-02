'use strict';

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// ✅ VERCEL FIX: Use environment port or 3000 for local
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ VERCEL FIX: Database path that works on both local and Vercel
const db = new sqlite3.Database(process.env.DATABASE_URL || './data/database.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT,
    amount INTEGER,
    package TEXT,
    status TEXT DEFAULT 'pending',
    voucher_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.log('Database table creation error:', err);
    } else {
      console.log('✅ Database tables ready');
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/payment', (req, res) => {
  const { phone, package: pkg, amount } = req.body;

  // ✅ HEROKU FIX: Better input validation
  if (!phone || !pkg || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phone, package, amount'
    });
  }

  // Validate phone number format
  if (!/^07[0-9]{8}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format. Use 07XXXXXXXX'
    });
  }

  // Generate voucher code
  const voucherCode = 'WIFI' + Math.random().toString(36).substr(2, 8).toUpperCase();

  console.log(`🔄 Processing payment: ${phone} for ${pkg} - ${amount} UGX`);

  // For demo purposes, simulate successful payment without database
  console.log(`✅ Payment simulation successful:`);
  console.log(`   📱 Phone: ${phone}`);
  console.log(`   🎫 Voucher: ${voucherCode}`);
  console.log(`   📦 Package: ${pkg}`);
  console.log(`   💰 Amount: ${amount} UGX`);

  res.json({
    success: true,
    voucher_code: voucherCode,
    message: `Payment successful! Your voucher code: ${voucherCode}`,
    payment_id: Math.floor(Math.random() * 10000)
  });
});

// ✅ HEROKU FIX: Health check endpoint (important for monitoring)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'WiFi Payment System',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ HEROKU FIX: Root endpoint response
app.get('/api', (req, res) => {
  res.json({
    message: 'WiFi Payment System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      payment: '/api/payment (POST)'
    }
  });
});

// ✅ HEROKU FIX: Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ✅ HEROKU FIX: 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ✅ RAILWAY FIX: Start server normally for Railway deployment
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});