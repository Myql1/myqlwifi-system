const axios = require('axios');

class SMSFallbackProvider {
  constructor() {
    this.providers = [
      {
        name: 'africas_talking',
        send: this.sendViaAfricasTalking.bind(this),
        priority: 1
      },
      {
        name: 'twilio',
        send: this.sendViaTwilio.bind(this),
        priority: 2
      },
      {
        name: 'messagebird',
        send: this.sendViaMessageBird.bind(this),
        priority: 3
      }
    ];
  }

  // Main send method with fallback logic
  async sendSMS(phoneNumbers, message, options = {}) {
    const errors = [];
    let lastResult = null;

    // Sort providers by priority
    const sortedProviders = this.providers.sort((a, b) => a.priority - b.priority);

    for (const provider of sortedProviders) {
      try {
        console.log(`Attempting to send SMS via ${provider.name}`);

        const result = await provider.send(phoneNumbers, message, options);

        if (result.status === 'success') {
          console.log(`SMS sent successfully via ${provider.name}`);
          return {
            ...result,
            provider: provider.name,
            fallback_used: errors.length > 0
          };
        } else {
          errors.push({
            provider: provider.name,
            error: result.message,
            timestamp: new Date().toISOString()
          });
          lastResult = result;
        }
      } catch (error) {
        console.error(`SMS provider ${provider.name} failed:`, error.message);
        errors.push({
          provider: provider.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // All providers failed
    console.error('All SMS providers failed:', errors);
    return {
      status: 'failed',
      message: 'All SMS providers failed',
      errors: errors,
      last_result: lastResult
    };
  }

  // Africa's Talking implementation
  async sendViaAfricasTalking(phoneNumbers, message, options) {
    try {
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        {
          username: process.env.AT_USERNAME,
          to: Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : phoneNumbers,
          message: message,
          from: options.from || 'MYQLWIFI'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'apiKey': process.env.AT_API_KEY
          }
        }
      );

      // Parse Africa's Talking response
      const result = this.parseAfricasTalkingResponse(response.data);

      return {
        status: result.Success ? 'success' : 'failed',
        message: result.Success ? 'SMS sent successfully' : 'Failed to send SMS',
        response: result,
        cost: result.cost,
        recipients: result.recipients
      };
    } catch (error) {
      throw new Error(`Africa's Talking error: ${error.message}`);
    }
  }

  // Twilio implementation
  async sendViaTwilio(phoneNumbers, message, options) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const phones = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers];

      const results = [];

      for (const phone of phones) {
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          new URLSearchParams({
            To: phone,
            From: fromNumber,
            Body: message
          }),
          {
            auth: {
              username: accountSid,
              password: authToken
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        results.push({
          to: phone,
          status: response.data.status,
          sid: response.data.sid
        });
      }

      return {
        status: 'success',
        message: 'SMS sent via Twilio',
        response: results,
        recipients: results.length
      };
    } catch (error) {
      throw new Error(`Twilio error: ${error.message}`);
    }
  }

  // MessageBird implementation
  async sendViaMessageBird(phoneNumbers, message, options) {
    try {
      const accessKey = process.env.MESSAGEBIRD_ACCESS_KEY;
      const originator = process.env.MESSAGEBIRD_ORIGINATOR || 'MYQLWIFI';

      if (!accessKey) {
        throw new Error('MessageBird access key not configured');
      }

      const phones = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers];

      const response = await axios.post(
        'https://rest.messagebird.com/messages',
        {
          recipients: phones,
          originator: originator,
          body: message
        },
        {
          headers: {
            'Authorization': `AccessKey ${accessKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: 'success',
        message: 'SMS sent via MessageBird',
        response: response.data,
        recipients: phones.length,
        id: response.data.id
      };
    } catch (error) {
      throw new Error(`MessageBird error: ${error.message}`);
    }
  }

  // Parse Africa's Talking response
  parseAfricasTalkingResponse(responseText) {
    try {
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

  // Check SMS balance across providers
  async checkBalances() {
    const balances = {};

    for (const provider of this.providers) {
      try {
        switch (provider.name) {
          case 'africas_talking':
            balances.africas_talking = await this.checkAfricasTalkingBalance();
            break;
          case 'twilio':
            balances.twilio = await this.checkTwilioBalance();
            break;
          case 'messagebird':
            balances.messagebird = await this.checkMessageBirdBalance();
            break;
        }
      } catch (error) {
        console.error(`Failed to check balance for ${provider.name}:`, error.message);
        balances[provider.name] = { error: error.message };
      }
    }

    return balances;
  }

  async checkAfricasTalkingBalance() {
    try {
      const response = await axios.get('https://api.africastalking.com/version1/user', {
        params: { username: process.env.AT_USERNAME },
        headers: {
          'Accept': 'application/json',
          'apiKey': process.env.AT_API_KEY
        }
      });

      return {
        balance: response.data.UserData.balance,
        currency: response.data.UserData.currencyCode
      };
    } catch (error) {
      throw new Error(`Africa's Talking balance check failed: ${error.message}`);
    }
  }

  async checkTwilioBalance() {
    // Twilio balance checking would require additional API calls
    // For now, return a placeholder
    return { status: 'not_implemented' };
  }

  async checkMessageBirdBalance() {
    // MessageBird balance checking would require additional API calls
    // For now, return a placeholder
    return { status: 'not_implemented' };
  }

  // Add a new provider
  addProvider(name, sendFunction, priority = 99) {
    this.providers.push({
      name,
      send: sendFunction,
      priority
    });
  }

  // Remove a provider
  removeProvider(name) {
    this.providers = this.providers.filter(p => p.name !== name);
  }

  // Update provider priority
  updateProviderPriority(name, newPriority) {
    const provider = this.providers.find(p => p.name === name);
    if (provider) {
      provider.priority = newPriority;
    }
  }
}

module.exports = new SMSFallbackProvider();