@echo off
echo Creating WiFi Payment System...

:: Create folder structure
mkdir config
mkdir routes
mkdir public
mkdir data
mkdir services

:: Create package.json
echo { > package.json
echo   "name": "wifi-payment-system", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "description": "WiFi Payment Gateway with Mobile Money", >> package.json
echo   "main": "app.js", >> package.json
echo   "scripts": { >> package.json
echo     "start": "node app.js", >> package.json
echo     "dev": "nodemon app.js" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "express": "^4.18.0", >> package.json
echo     "sqlite3": "^5.1.0", >> package.json
echo     "axios": "^1.4.0", >> package.json
echo     "cors": "^2.8.5", >> package.json
echo     "dotenv": "^16.0.0" >> package.json
echo   } >> package.json
echo } >> package.json

:: Create main app file
echo const express = require('express'); > app.js
echo const sqlite3 = require('sqlite3').verbose(); >> app.js
echo const path = require('path'); >> app.js
echo const app = express(); >> app.js
echo const PORT = 3000; >> app.js
echo. >> app.js
echo app.use(express.json()); >> app.js
echo app.use(express.static('public')); >> app.js
echo. >> app.js
echo // Simple SQLite database >> app.js
echo const db = new sqlite3.Database('./data/database.db'); >> app.js
echo. >> app.js
echo // Create tables >> app.js
echo db.serialize(() => { >> app.js
echo   db.run(`CREATE TABLE IF NOT EXISTS payments ( >> app.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT, >> app.js
echo     phone_number TEXT, >> app.js
echo     amount INTEGER, >> app.js
echo     package TEXT, >> app.js
echo     status TEXT DEFAULT 'pending', >> app.js
echo     voucher_code TEXT, >> app.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP >> app.js
echo   )`); >> app.js
echo. >> app.js
echo   db.run(`CREATE TABLE IF NOT EXISTS vouchers ( >> app.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT, >> app.js
echo     code TEXT UNIQUE, >> app.js
echo     duration_minutes INTEGER, >> app.js
echo     status TEXT DEFAULT 'active', >> app.js
echo     used_at DATETIME, >> app.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP >> app.js
echo   )`); >> app.js
echo }); >> app.js
echo. >> app.js
echo // Routes >> app.js
echo app.get('/', (req, res) => { >> app.js
echo   res.sendFile(path.join(__dirname, 'public', 'index.html')); >> app.js
echo }); >> app.js
echo. >> app.js
echo app.post('/api/payment', (req, res) => { >> app.js
echo   const { phone, package, amount } = req.body; >> app.js
echo. >> app.js
echo   // Generate simple voucher (for testing) >> app.js
echo   const voucherCode = 'TEST' + Math.random().toString(36).substr(2, 8).toUpperCase(); >> app.js
echo. >> app.js
echo   db.run( >> app.js
echo     "INSERT INTO payments (phone_number, amount, package, status, voucher_code) VALUES (?, ?, ?, 'completed', ?)", >> app.js
echo     [phone, amount, package, voucherCode], >> app.js
echo     function(err) { >> app.js
echo       if (err) { >> app.js
echo         return res.status(500).json({ error: 'Payment failed' }); >> app.js
echo       } >> app.js
echo. >> app.js
echo       // Simulate SMS sending >> app.js
echo       console.log("SMS would be sent to: " + phone); >> app.js
echo       console.log("Voucher Code: " + voucherCode); >> app.js
echo. >> app.js
echo       res.json({ >> app.js
echo         success: true, >> app.js
echo         voucher_code: voucherCode, >> app.js
echo         message: "Payment successful! Voucher: " + voucherCode >> app.js
echo       }); >> app.js
echo     } >> app.js
echo   ); >> app.js
echo }); >> app.js
echo. >> app.js
echo app.listen(PORT, () => { >> app.js
echo   console.log("WiFi Payment System running on http://localhost:" + PORT); >> app.js
echo   console.log("Test with phone: 0771234567"); >> app.js
echo }); >> app.js

:: Create the HTML payment page
echo ^<!DOCTYPE html^> > public/index.html
echo ^<html lang="en"^> >> public/index.html
echo ^<head^> >> public/index.html
echo     ^<meta charset="UTF-8"^> >> public/index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> public/index.html
echo     ^<title^>WiFi Payment Portal^</title^> >> public/index.html
echo     ^<style^> >> public/index.html
echo         body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; } >> public/index.html
echo         .package { border: 1px solid #ddd; padding: 15px; margin: 10px 0; cursor: pointer; } >> public/index.html
echo         .package.selected { border-color: #007bff; background: #f8f9fa; } >> public/index.html
echo         button { background: #007bff; color: white; padding: 12px; border: none; width: 100%; cursor: pointer; } >> public/index.html
echo         input { width: 100%; padding: 10px; margin: 5px 0; } >> public/index.html
echo         #result { margin-top: 20px; padding: 15px; display: none; } >> public/index.html
echo         .success { background: #d4edda; color: #155724; } >> public/index.html
echo     ^</style^> >> public/index.html
echo ^</head^> >> public/index.html
echo ^<body^> >> public/index.html
echo     ^<h1^>WiFi Internet Access^</h1^> >> public/index.html
echo     ^<p^>Select your package and pay via Mobile Money^</p^> >> public/index.html
echo. >> public/index.html
echo     ^<div class="package" data-package="1hour" data-amount="1000"^> >> public/index.html
echo         ^<h3^>1 Hour Access - 1,000 UGX^</h3^> >> public/index.html
echo         ^<p^>Perfect for quick browsing^</p^> >> public/index.html
echo     ^</div^> >> public/index.html
echo. >> public/index.html
echo     ^<div class="package" data-package="1day" data-amount="5000"^> >> public/index.html
echo         ^<h3^>1 Day Access - 5,000 UGX^</h3^> >> public/index.html
echo         ^<p^>Full day internet access^</p^> >> public/index.html
echo     ^</div^> >> public/index.html
echo. >> public/index.html
echo     ^<div class="package" data-package="1week" data-amount="20000"^> >> public/index.html
echo         ^<h3^>1 Week Access - 20,000 UGX^</h3^> >> public/index.html
echo         ^<p^>Weekly unlimited access^</p^> >> public/index.html
echo     ^</div^> >> public/index.html
echo. >> public/index.html
echo     ^<input type="tel" id="phone" placeholder="Enter your phone number (0771234567)" required^> >> public/index.html
echo     ^<button onclick="processPayment()"^>Pay Now^</button^> >> public/index.html
echo. >> public/index.html
echo     ^<div id="result"^>^</div^> >> public/index.html
echo. >> public/index.html
echo     ^<script^> >> public/index.html
echo         let selectedPackage = null; >> public/index.html
echo. >> public/index.html
echo         // Package selection >> public/index.html
echo         document.querySelectorAll('.package').forEach(pkg => { >> public/index.html
echo             pkg.addEventListener('click', () => { >> public/index.html
echo                 document.querySelectorAll('.package').forEach(p => p.classList.remove('selected')); >> public/index.html
echo                 pkg.classList.add('selected'); >> public/index.html
echo                 selectedPackage = { >> public/index.html
echo                     package: pkg.dataset.package, >> public/index.html
echo                     amount: parseInt(pkg.dataset.amount) >> public/index.html
echo                 }; >> public/index.html
echo             }); >> public/index.html
echo         }); >> public/index.html
echo. >> public/index.html
echo         // Payment processing >> public/index.html
echo         async function processPayment() { >> public/index.html
echo             const phone = document.getElementById('phone').value; >> public/index.html
echo. >> public/index.html
echo             if (!selectedPackage || !phone) { >> public/index.html
echo                 alert('Please select a package and enter your phone number'); >> public/index.html
echo                 return; >> public/index.html
echo             } >> public/index.html
echo. >> public/index.html
echo             try { >> public/index.html
echo                 const response = await fetch('/api/payment', { >> public/index.html
echo                     method: 'POST', >> public/index.html
echo                     headers: { 'Content-Type': 'application/json' }, >> public/index.html
echo                     body: JSON.stringify({ >> public/index.html
echo                         phone: phone, >> public/index.html
echo                         package: selectedPackage.package, >> public/index.html
echo                         amount: selectedPackage.amount >> public/index.html
echo                     }) >> public/index.html
echo                 }); >> public/index.html
echo. >> public/index.html
echo                 const result = await response.json(); >> public/index.html
echo. >> public/index.html
echo                 if (result.success) { >> public/index.html
echo                     document.getElementById('result').innerHTML = >> public/index.html
echo                         '^<div class="success"^>' + >> public/index.html
echo                         '^<h3^>Payment Successful!^</h3^>' + >> public/index.html
echo                         '^<p^>^<strong^>Voucher Code:^</strong^> ' + result.voucher_code + '^</p^>' + >> public/index.html
echo                         '^<p^>^<strong^>Phone:^</strong^> ' + phone + '^</p^>' + >> public/index.html
echo                         '^<p^>^<strong^>Package:^</strong^> ' + selectedPackage.package + '^</p^>' + >> public/index.html
echo                         '^<p^>Use this code to access WiFi. An SMS has been sent to your phone.^</p^>' + >> public/index.html
echo                         '^</div^>'; >> public/index.html
echo                     document.getElementById('result').style.display = 'block'; >> public/index.html
echo                 } else { >> public/index.html
echo                     alert('Payment failed: ' + result.error); >> public/index.html
echo                 } >> public/index.html
echo             } catch (error) { >> public/index.html
echo                 alert('Error processing payment: ' + error.message); >> public/index.html
echo             } >> public/index.html
echo         } >> public/index.html
echo     ^</script^> >> public/index.html
echo ^</body^> >> public/index.html
echo ^</html^> >> public/index.html

echo Setup complete!
echo.
echo Now run these commands:
echo npm install
echo node app.js
pause