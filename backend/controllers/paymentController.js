const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const Package = require('../models/Package');
const Router = require('../models/Router');
const SmsLog = require('../models/SmsLog');
const airtelApi = require('../utils/airtelApi');
const mtnApi = require('../utils/mtnApi');
const africasTalking = require('../utils/africasTalking');
const OmadaAPI = require('../utils/omadaApi');

// Initiate payment
const initiatePayment = async (req, res) => {
  try {
    const { phoneNumber, packageId, provider } = req.body;

    if (!phoneNumber || !packageId || !provider) {
      return res.status(400).json({ error: 'Phone number, package ID, and provider are required' });
    }

    // Validate provider
    if (!['airtel', 'mtn'].includes(provider.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid provider. Must be airtel or mtn' });
    }

    // Get package details
    const packageInfo = await Package.findById(packageId);
    if (!packageInfo) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Generate transaction ID
    const transactionId = `MYQL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const paymentId = await Payment.create({
      transaction_id: transactionId,
      customer_phone: phoneNumber,
      provider: provider.toLowerCase(),
      package_id: packageId,
      amount: packageInfo.price_ugx
    });

    let paymentResult;

    try {
      // Initiate payment based on provider
      if (provider.toLowerCase() === 'airtel') {
        paymentResult = await airtelApi.initiateUssdPush(
          phoneNumber,
          packageInfo.price_ugx,
          transactionId
        );
      } else if (provider.toLowerCase() === 'mtn') {
        paymentResult = await mtnApi.requestToPay(
          phoneNumber,
          packageInfo.price_ugx,
          transactionId
        );
      }

      // Update payment with provider reference
      if (paymentResult.transaction_id) {
        await Payment.updateStatus(paymentId, 'pending', paymentResult.transaction_id);
      }

      res.json({
        transaction_id: transactionId,
        status: 'pending',
        amount: packageInfo.price_ugx,
        package: packageInfo.name,
        message: 'Payment initiated. Please check your phone for USSD prompt.'
      });

    } catch (apiError) {
      console.error('Payment API error:', apiError);
      await Payment.updateStatus(paymentId, 'failed');
      res.status(500).json({ error: 'Failed to initiate payment. Please try again.' });
    }

  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle Airtel payment callback
const airtelCallback = async (req, res) => {
  try {
    const { transaction_id, status, amount } = req.body;

    console.log('Airtel callback received:', { transaction_id, status, amount });

    // Find payment by transaction ID
    const payment = await Payment.findByTransactionId(transaction_id);
    if (!payment) {
      console.error('Payment not found for transaction:', transaction_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'success' || status === 'completed') {
      await processSuccessfulPayment(payment);
    } else if (status === 'failed') {
      await Payment.updateStatus(payment.id, 'failed');
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Airtel callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle MTN payment callback
const mtnCallback = async (req, res) => {
  try {
    const { externalId, status, amount } = req.body;

    console.log('MTN callback received:', { externalId, status, amount });

    // Find payment by transaction ID
    const payment = await Payment.findByTransactionId(externalId);
    if (!payment) {
      console.error('Payment not found for transaction:', externalId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'SUCCESSFUL') {
      await processSuccessfulPayment(payment);
    } else if (status === 'FAILED') {
      await Payment.updateStatus(payment.id, 'failed');
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('MTN callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Process successful payment
const processSuccessfulPayment = async (payment) => {
  try {
    // Update payment status
    await Payment.updateStatus(payment.id, 'completed');

    // Get active router (for now, use the first active router)
    const routers = await Router.getAll(true);
    if (routers.length === 0) {
      console.error('No active routers found');
      return;
    }

    const router = routers[0]; // Use first active router

    // Create voucher
    const voucher = await Voucher.create({
      router_id: router.id,
      package_id: payment.package_id,
      payment_id: payment.id,
      customer_phone: payment.customer_phone
    });

    // Create Omada voucher
    const omadaApi = new OmadaAPI(
      router.omada_controller_url,
      router.omada_username,
      router.omada_password
    );

    try {
      const sites = await omadaApi.getSites();
      if (sites && sites.length > 0) {
        const siteId = sites[0].id; // Use first site
        const omadaVoucher = await omadaApi.createVoucher(siteId, {
          name: `MYQL-${voucher.code}`,
          duration: payment.duration_hours
        });

        console.log('Omada voucher created:', omadaVoucher);
      }
    } catch (omadaError) {
      console.error('Omada API error:', omadaError);
      // Continue even if Omada fails - voucher is still valid in our system
    }

    // Send SMS with voucher code
    const packageInfo = await Package.findById(payment.package_id);
    const expiryDate = voucher.expires_at.toLocaleDateString();

    const smsResult = await africasTalking.sendVoucherSMS(
      payment.customer_phone,
      voucher.code,
      packageInfo.name,
      expiryDate
    );

    // Log SMS with fallback information
    await SmsLog.create({
      phone: payment.customer_phone,
      message: `Voucher code: ${voucher.code} for ${packageInfo.name}`,
      status: smsResult.status === 'success' ? 'sent' : 'failed',
      provider: smsResult.provider || 'africas_talking',
      reference_id: smsResult.response?.messageId || smsResult.id
    });

    // Log fallback usage if applicable
    if (smsResult.fallback_used) {
      console.warn('SMS fallback was used for payment:', {
        paymentId: payment.id,
        originalError: smsResult.original_error,
        fallbackProvider: smsResult.provider
      });
    }

    console.log('Payment processed successfully:', {
      paymentId: payment.id,
      voucherCode: voucher.code,
      smsSent: smsResult.status === 'success'
    });

  } catch (error) {
    console.error('Process successful payment error:', error);
    // Don't throw error here as payment was successful
  }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findByTransactionId(transactionId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check with provider API if still pending
    if (payment.status === 'pending') {
      try {
        let statusResult;

        if (payment.provider === 'airtel') {
          statusResult = await airtelApi.checkPaymentStatus(payment.payment_reference);
          if (statusResult.status === 'success') {
            await processSuccessfulPayment(payment);
            payment.status = 'completed';
          }
        } else if (payment.provider === 'mtn') {
          statusResult = await mtnApi.getPaymentStatus(payment.payment_reference);
          if (statusResult.status === 'SUCCESSFUL') {
            await processSuccessfulPayment(payment);
            payment.status = 'completed';
          }
        }
      } catch (apiError) {
        console.error('Check payment status API error:', apiError);
      }
    }

    res.json({
      transaction_id: payment.transaction_id,
      status: payment.status,
      amount: payment.amount,
      package_name: payment.package_name,
      created_at: payment.created_at
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  initiatePayment,
  airtelCallback,
  mtnCallback,
  checkPaymentStatus
};