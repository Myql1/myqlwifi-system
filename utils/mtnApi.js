const axios = require('axios');
const crypto = require('crypto');

class MTNMobileMoneyAPI {
  constructor() {
    this.baseURL = process.env.MTN_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.apiKey = process.env.MTN_API_KEY;
    this.apiSecret = process.env.MTN_API_SECRET;
    this.collectionSubKey = process.env.MTN_COLLECTION_SUB_KEY;
    this.disbursementSubKey = process.env.MTN_DISBURSEMENT_SUB_KEY;
    this.environment = process.env.MTN_ENVIRONMENT || 'sandbox';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth2 access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

      const response = await axios.post(`${this.baseURL}/collection/token/`, {}, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.collectionSubKey
        }
      });

      this.accessToken = response.data.access_token;
      // Token typically expires in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      return this.accessToken;
    } catch (error) {
      console.error('MTN API - Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with MTN API');
    }
  }

  // Create API user (one-time setup)
  async createAPIUser() {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1_0/apiuser`,
        {
          providerCallbackHost: process.env.BASE_URL || 'http://localhost:3000'
        },
        {
          headers: {
            'X-Reference-Id': crypto.randomUUID(),
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.collectionSubKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MTN API - Failed to create API user:', error.response?.data || error.message);
      throw error;
    }
  }

  // Initiate payment collection
  async initiatePayment(phoneNumber, amount, reference) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        amount: amount.toString(),
        currency: 'UGX',
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber.replace(/^\+/, '') // Remove + if present
        },
        payerMessage: 'WiFi Internet Access Payment',
        payeeNote: 'Payment for WiFi access'
      };

      const response = await axios.post(
        `${this.baseURL}/collection/v1_0/requesttopay`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': crypto.randomUUID(),
            'X-Target-Environment': this.environment,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.collectionSubKey
          }
        }
      );

      return {
        success: true,
        transactionId: response.headers['x-reference-id'],
        status: 'pending',
        data: response.data
      };

    } catch (error) {
      console.error('MTN API - Payment initiation failed:', error.response?.data || error.message);
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
        `${this.baseURL}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.collectionSubKey
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        transactionId: transactionId,
        data: response.data
      };

    } catch (error) {
      console.error('MTN API - Status check failed:', error.response?.data || error.message);

      // MTN returns 404 for pending transactions, 200 for completed
      if (error.response?.status === 404) {
        return {
          success: true,
          status: 'pending',
          transactionId: transactionId,
          data: { status: 'pending' }
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = new MTNMobileMoneyAPI();