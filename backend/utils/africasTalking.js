const axios = require('axios');
const smsFallback = require('./smsFallback');

class AfricasTalkingSMS {
  constructor() {
    this.username = process.env.AT_USERNAME;
    this.apiKey = process.env.AT_API_KEY;
    this.baseUrl = 'https://api.africastalking.com/version1/messaging';
  }

  // Send SMS with fallback
  async sendSMS(phoneNumbers, message) {
    try {
      // Ensure phone numbers are in international format
      const formattedNumbers = Array.isArray(phoneNumbers)
        ? phoneNumbers.map(num => this.formatPhoneNumber(num))
        : [this.formatPhoneNumber(phoneNumbers)];

      // Try Africa's Talking first
      const response = await axios.post(this.baseUrl, {
        username: this.username,
        to: formattedNumbers.join(','),
        message: message,
        from: 'MYQLWIFI'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': this.apiKey
        }
      });

      // Parse the response (Africa's Talking returns plain text)
      const result = this.parseResponse(response.data);

      return {
        status: 'success',
        message: result.message || 'SMS sent successfully',
        recipients: result.recipients || formattedNumbers.length,
        cost: result.cost,
        response: result,
        provider: 'africas_talking'
      };
    } catch (error) {
      console.error('Africa\'s Talking SMS error:', error.response?.data || error.message);

      // Try fallback providers
      console.log('Attempting SMS fallback...');
      try {
        const fallbackResult = await smsFallback.sendSMS(phoneNumbers, message, {
          from: 'MYQLWIFI',
          primary_provider_failed: true
        });

        if (fallbackResult.status === 'success') {
          return {
            ...fallbackResult,
            fallback_used: true,
            original_error: error.response?.data || error.message
          };
        }
      } catch (fallbackError) {
        console.error('SMS fallback also failed:', fallbackError.message);
      }

      return {
        status: 'failed',
        message: 'Failed to send SMS via all providers',
        error: error.response?.data || error.message,
        fallback_attempted: true
      };
    }
  }

  // Send voucher code via SMS
  async sendVoucherSMS(phoneNumber, voucherCode, packageName, expiryDate) {
    const message = `MYQL WIFI: Your voucher code is ${voucherCode} for ${packageName}. Valid until ${expiryDate}. Connect to MYQL WIFI network and enter the code.`;

    return await this.sendSMS(phoneNumber, message);
  }

  // Send payment confirmation SMS
  async sendPaymentConfirmation(phoneNumber, amount, packageName) {
    const message = `MYQL WIFI: Payment of UGX ${amount} for ${packageName} received successfully. Your voucher will be sent shortly.`;

    return await this.sendSMS(phoneNumber, message);
  }

  // Send low balance alert
  async sendLowBalanceAlert(phoneNumber, currentBalance) {
    const message = `MYQL WIFI Alert: Your account balance is low (UGX ${currentBalance}). Please top up to continue services.`;

    return await this.sendSMS(phoneNumber, message);
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, hyphens, or brackets
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // If it starts with 0, replace with +256
    if (cleaned.startsWith('0')) {
      cleaned = '+256' + cleaned.substring(1);
    }

    // If it doesn't start with +, add +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  // Parse Africa's Talking response
  parseResponse(responseText) {
    try {
      // Africa's Talking returns responses like:
      // "Success|Recipients=1|Cost=0.0080|MessageId=12345"
      const parts = responseText.split('|');
      const result = {};

      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
          result[key.toLowerCase()] = value;
        } else {
          result.status = part;
        }
      });

      return result;
    } catch (error) {
      console.error('Error parsing Africa\'s Talking response:', error);
      return { status: 'error', message: 'Failed to parse response' };
    }
  }

  // Check SMS balance
  async getBalance() {
    try {
      const response = await axios.get('https://api.africastalking.com/version1/user', {
        params: {
          username: this.username
        },
        headers: {
          'Accept': 'application/json',
          'apiKey': this.apiKey
        }
      });

      return {
        balance: response.data.UserData.balance,
        currency: response.data.UserData.currencyCode
      };
    } catch (error) {
      console.error('Africa\'s Talking balance check error:', error.response?.data || error.message);
      throw new Error('Failed to get SMS balance');
    }
  }
}

module.exports = new AfricasTalkingSMS();