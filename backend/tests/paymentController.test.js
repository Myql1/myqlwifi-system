const paymentController = require('../controllers/paymentController');
const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const Package = require('../models/Package');
const Router = require('../models/Router');
const SmsLog = require('../models/SmsLog');
const airtelApi = require('../utils/airtelApi');
const mtnApi = require('../utils/mtnApi');
const africasTalking = require('../utils/africasTalking');
const OmadaAPI = require('../utils/omadaApi');

// Mock all dependencies
jest.mock('../models/Payment');
jest.mock('../models/Voucher');
jest.mock('../models/Package');
jest.mock('../models/Router');
jest.mock('../models/SmsLog');
jest.mock('../utils/airtelApi');
jest.mock('../utils/mtnApi');
jest.mock('../utils/africasTalking');
jest.mock('../utils/omadaApi');

describe('Payment Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should initiate payment successfully', async () => {
      req.body = {
        phoneNumber: '+256700000000',
        packageId: 1,
        provider: 'airtel'
      };

      const mockPackage = { id: 1, name: 'Daily', price_ugx: 1000 };
      const mockPaymentId = 1;
      const mockTransactionId = 'MYQL-1234567890-abc123';

      Package.findById.mockResolvedValue(mockPackage);
      Payment.create.mockResolvedValue(mockPaymentId);
      airtelApi.initiateUssdPush.mockResolvedValue({
        transaction_id: 'airtel-tx-123',
        status: 'pending'
      });

      await paymentController.initiatePayment(req, res);

      expect(Package.findById).toHaveBeenCalledWith(1);
      expect(Payment.create).toHaveBeenCalledWith({
        transaction_id: mockTransactionId,
        customer_phone: '+256700000000',
        provider: 'airtel',
        package_id: 1,
        amount: 1000
      });
      expect(res.json).toHaveBeenCalledWith({
        transaction_id: mockTransactionId,
        status: 'pending',
        amount: 1000,
        package: 'Daily',
        message: 'Payment initiated. Please check your phone for USSD prompt.'
      });
    });

    it('should return error for invalid provider', async () => {
      req.body = {
        phoneNumber: '+256700000000',
        packageId: 1,
        provider: 'invalid'
      };

      await paymentController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid provider. Must be airtel or mtn' });
    });

    it('should return error for missing required fields', async () => {
      req.body = { phoneNumber: '+256700000000' };

      await paymentController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Phone number, package ID, and provider are required' });
    });
  });

  describe('airtelCallback', () => {
    it('should process successful Airtel payment', async () => {
      req.body = {
        transaction_id: 'airtel-tx-123',
        status: 'success',
        amount: 1000
      };

      const mockPayment = {
        id: 1,
        package_id: 1,
        customer_phone: '+256700000000'
      };

      Payment.findByTransactionId.mockResolvedValue(mockPayment);
      Router.getAll.mockResolvedValue([{ id: 1, omada_controller_url: 'http://omada.example.com', omada_username: 'admin', omada_password: 'pass' }]);
      Voucher.create.mockResolvedValue({ id: 1, code: 'ABC12345', expires_at: new Date() });
      Package.findById.mockResolvedValue({ id: 1, name: 'Daily' });
      africasTalking.sendVoucherSMS.mockResolvedValue({ status: 'success' });
      SmsLog.create.mockResolvedValue();

      await paymentController.airtelCallback(req, res);

      expect(Payment.findByTransactionId).toHaveBeenCalledWith('airtel-tx-123');
      expect(Payment.updateStatus).toHaveBeenCalledWith(1, 'completed');
      expect(Voucher.create).toHaveBeenCalled();
      expect(africasTalking.sendVoucherSMS).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('mtnCallback', () => {
    it('should process successful MTN payment', async () => {
      req.body = {
        externalId: 'mtn-tx-123',
        status: 'SUCCESSFUL',
        amount: 1000
      };

      const mockPayment = {
        id: 1,
        package_id: 1,
        customer_phone: '+256700000000'
      };

      Payment.findByTransactionId.mockResolvedValue(mockPayment);
      Router.getAll.mockResolvedValue([{ id: 1, omada_controller_url: 'http://omada.example.com', omada_username: 'admin', omada_password: 'pass' }]);
      Voucher.create.mockResolvedValue({ id: 1, code: 'ABC12345', expires_at: new Date() });
      Package.findById.mockResolvedValue({ id: 1, name: 'Daily' });
      africasTalking.sendVoucherSMS.mockResolvedValue({ status: 'success' });
      SmsLog.create.mockResolvedValue();

      await paymentController.mtnCallback(req, res);

      expect(Payment.findByTransactionId).toHaveBeenCalledWith('mtn-tx-123');
      expect(Payment.updateStatus).toHaveBeenCalledWith(1, 'completed');
      expect(Voucher.create).toHaveBeenCalled();
      expect(africasTalking.sendVoucherSMS).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('checkPaymentStatus', () => {
    it('should return payment status', async () => {
      req.params.transactionId = 'MYQL-1234567890-abc123';

      const mockPayment = {
        transaction_id: 'MYQL-1234567890-abc123',
        status: 'completed',
        amount: 1000,
        package_name: 'Daily',
        created_at: new Date()
      };

      Payment.findByTransactionId.mockResolvedValue(mockPayment);

      await paymentController.checkPaymentStatus(req, res);

      expect(Payment.findByTransactionId).toHaveBeenCalledWith('MYQL-1234567890-abc123');
      expect(res.json).toHaveBeenCalledWith({
        transaction_id: 'MYQL-1234567890-abc123',
        status: 'completed',
        amount: 1000,
        package_name: 'Daily',
        created_at: mockPayment.created_at
      });
    });

    it('should return error for non-existent payment', async () => {
      req.params.transactionId = 'non-existent';

      Payment.findByTransactionId.mockResolvedValue(null);

      await paymentController.checkPaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Payment not found' });
    });
  });
});