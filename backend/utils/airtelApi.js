const axios = require('axios');
const crypto = require('crypto');

class AirtelMoneyAPI {
  constructor() {
    this.baseUrl = process.env.AIRTEL_ENVIRONMENT === 'sandbox'
      ? 'https://openapi-sandbox.airtel.africa/'
      : 'https://openapi.airtel.africa/';

    this.clientId = process.env.AIRTEL_API_KEY;
    this.clientSecret = process.env.AIRTEL_API_SECRET;
    this.environment = process.env.AIRTEL_ENVIRONMENT || 'sandbox';
  }

  // Generate access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(`${this.baseUrl}auth/oauth2/token`, {
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Airtel API - Get access token error:', error.response?.data || error.message);
      throw new Error('Failed to get access token');
    }
  }

  // Initiate USSD push payment
  async initiateUssdPush(phoneNumber, amount, reference, currency = 'UGX') {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        subscriber_msisdn: phoneNumber,
        amount: amount.toString(),
        currency: currency,
        reference: reference,
        callback_url: `${process.env.BASE_URL}/api/payments/airtel/callback`
      };

      const response = await axios.post(
        `${this.baseUrl}merchant/v1/payments/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': currency
          }
        }
      );

      return {
        transaction_id: response.data.transaction_id,
        status: response.data.status,
        response: response.data
      };
    } catch (error) {
      console.error('Airtel API - USSD push error:', error.response?.data || error.message);
      throw new Error('Failed to initiate USSD push payment');
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}merchant/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': 'UGX'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Airtel API - Check payment status error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }

  // Process disbursement (settlement to business account)
  async disburse(amount, phoneNumber, reference, currency = 'UGX') {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        payee: {
          msisdn: phoneNumber
        },
        amount: amount.toString(),
        currency: currency,
        reference: reference,
        callback_url: `${process.env.BASE_URL}/api/payments/airtel/disburse-callback`
      };

      const response = await axios.post(
        `${this.baseUrl}disbursement/v1_0/transfer`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': currency
          }
        }
      );

      return {
        transaction_id: response.data.transaction_id,
        status: response.data.status,
        response: response.data
      };
    } catch (error) {
      console.error('Airtel API - Disburse error:', error.response?.data || error.message);
      throw new Error('Failed to process disbursement');
    }
  }

  // Validate callback signature
  validateCallbackSignature(requestBody, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.clientSecret)
        .update(JSON.stringify(requestBody))
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Airtel API - Signature validation error:', error);
      return false;
    }
  }
}

module.exports = new AirtelMoneyAPI();