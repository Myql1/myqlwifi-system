const axios = require('axios');
const crypto = require('crypto');

class MTNMobileMoneyAPI {
  constructor() {
    this.baseUrl = process.env.MTN_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox.momodeveloper.mtn.com/'
      : 'https://momodeveloper.mtn.com/';

    this.apiKey = process.env.MTN_API_KEY;
    this.apiSecret = process.env.MTN_API_SECRET;
    this.environment = process.env.MTN_ENVIRONMENT || 'sandbox';
    this.subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
  }

  // Generate access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

      const response = await axios.post(`${this.baseUrl}collection/token/`, {}, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('MTN API - Get access token error:', error.response?.data || error.message);
      throw new Error('Failed to get access token');
    }
  }

  // Create API user
  async createApiUser() {
    try {
      const response = await axios.post(
        `${this.baseUrl}v1_0/apiuser`,
        {
          providerCallbackHost: process.env.BASE_URL.replace('https://', '').replace('http://', '')
        },
        {
          headers: {
            'X-Reference-Id': crypto.randomUUID(),
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MTN API - Create API user error:', error.response?.data || error.message);
      throw new Error('Failed to create API user');
    }
  }

  // Get API user
  async getApiUser(apiUserId) {
    try {
      const response = await axios.get(`${this.baseUrl}v1_0/apiuser/${apiUserId}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('MTN API - Get API user error:', error.response?.data || error.message);
      throw new Error('Failed to get API user');
    }
  }

  // Create API key
  async createApiKey(apiUserId) {
    try {
      const response = await axios.post(`${this.baseUrl}v1_0/apiuser/${apiUserId}/apikey`, {}, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('MTN API - Create API key error:', error.response?.data || error.message);
      throw new Error('Failed to create API key');
    }
  }

  // Request to pay (initiate payment)
  async requestToPay(phoneNumber, amount, reference, currency = 'UGX') {
    try {
      const accessToken = await this.getAccessToken();
      const referenceId = crypto.randomUUID();

      const payload = {
        amount: amount.toString(),
        currency: currency,
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: 'MYQL WIFI Payment',
        payeeNote: 'WiFi Voucher Purchase'
      };

      const response = await axios.post(
        `${this.baseUrl}collection/v1_0/requesttopay`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        transaction_id: referenceId,
        status: 'pending',
        response: response.data
      };
    } catch (error) {
      console.error('MTN API - Request to pay error:', error.response?.data || error.message);
      throw new Error('Failed to initiate payment request');
    }
  }

  // Get payment status
  async getPaymentStatus(referenceId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MTN API - Get payment status error:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  // Transfer (disbursement)
  async transfer(amount, phoneNumber, reference, currency = 'UGX') {
    try {
      const accessToken = await this.getAccessToken();
      const referenceId = crypto.randomUUID();

      const payload = {
        amount: amount.toString(),
        currency: currency,
        externalId: reference,
        payee: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: 'MYQL WIFI Settlement',
        payeeNote: 'Business Settlement'
      };

      const response = await axios.post(
        `${this.baseUrl}disbursement/v1_0/transfer`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        transaction_id: referenceId,
        status: 'pending',
        response: response.data
      };
    } catch (error) {
      console.error('MTN API - Transfer error:', error.response?.data || error.message);
      throw new Error('Failed to process transfer');
    }
  }

  // Get transfer status
  async getTransferStatus(referenceId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}disbursement/v1_0/transfer/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MTN API - Get transfer status error:', error.response?.data || error.message);
      throw new Error('Failed to get transfer status');
    }
  }
}

module.exports = new MTNMobileMoneyAPI();