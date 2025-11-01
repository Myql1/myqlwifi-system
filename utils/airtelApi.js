const axios = require('axios');
const crypto = require('crypto');

class AirtelMoneyAPI {
  constructor() {
    this.baseURL = process.env.AIRTEL_API_BASE_URL || 'https://openapi.airtel.africa';
    this.clientId = process.env.AIRTEL_CLIENT_ID;
    this.clientSecret = process.env.AIRTEL_CLIENT_SECRET;
    this.environment = process.env.AIRTEL_ENVIRONMENT || 'sandbox';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth2 access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(`${this.baseURL}/auth/oauth2/token`, {
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      // Token typically expires in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      return this.accessToken;
    } catch (error) {
      console.error('Airtel API - Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Airtel API');
    }
  }

  // Initiate payment collection
  async initiatePayment(phoneNumber, amount, reference) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        reference: reference,
        subscriber: {
          country: 'UG',
          currency: 'UGX',
          msisdn: phoneNumber.replace(/^\+/, '') // Remove + if present
        },
        transaction: {
          amount: amount,
          country: 'UG',
          currency: 'UGX',
          id: reference
        }
      };

      const response = await axios.post(
        `${this.baseURL}/merchant/v1/payments/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': 'UGX'
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.transaction?.id || response.data.id,
        status: response.data.status || 'pending',
        data: response.data
      };

    } catch (error) {
      console.error('Airtel API - Payment initiation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': 'UGX'
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        transactionId: response.data.transaction?.id || response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('Airtel API - Status check failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  // Validate webhook signature (if implemented)
  validateWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = new AirtelMoneyAPI();