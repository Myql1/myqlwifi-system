const User = require('../models/User');
const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const Package = require('../models/Package');

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn()
  }
}));

const { pool } = require('../config/database');

describe('Models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Model', () => {
    it('should create a user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      };

      pool.execute.mockResolvedValue([{ insertId: 1 }]);

      const result = await User.create(userData);

      expect(pool.execute).toHaveBeenCalledWith(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['testuser', 'test@example.com', expect.any(String), 'admin']
      );
      expect(result).toBe(1);
    });

    it('should find user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      };

      pool.execute.mockResolvedValue([[mockUser]]);

      const result = await User.findByUsername('testuser');

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = ?',
        ['testuser']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('Payment Model', () => {
    it('should create a payment', async () => {
      const paymentData = {
        transaction_id: 'TX-123',
        customer_phone: '+256700000000',
        provider: 'airtel',
        package_id: 1,
        amount: 1000
      };

      pool.execute.mockResolvedValue([{ insertId: 1 }]);

      const result = await Payment.create(paymentData);

      expect(pool.execute).toHaveBeenCalledWith(
        'INSERT INTO payments (transaction_id, customer_phone, provider, package_id, amount) VALUES (?, ?, ?, ?, ?)',
        ['TX-123', '+256700000000', 'airtel', 1, 1000]
      );
      expect(result).toBe(1);
    });

    it('should find payment by transaction ID', async () => {
      const mockPayment = {
        id: 1,
        transaction_id: 'TX-123',
        customer_phone: '+256700000000',
        provider: 'airtel',
        package_id: 1,
        amount: 1000,
        status: 'pending'
      };

      pool.execute.mockResolvedValue([[mockPayment]]);

      const result = await Payment.findByTransactionId('TX-123');

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT p.*, pkg.name as package_name, pkg.duration_hours FROM payments p JOIN packages pkg ON p.package_id = pkg.id WHERE p.transaction_id = ?',
        ['TX-123']
      );
      expect(result).toEqual(mockPayment);
    });

    it('should update payment status', async () => {
      pool.execute.mockResolvedValue([]);

      await Payment.updateStatus(1, 'completed', 'ref-123');

      expect(pool.execute).toHaveBeenCalledWith(
        'UPDATE payments SET status = ?, payment_reference = ? WHERE id = ?',
        ['completed', 'ref-123', 1]
      );
    });
  });

  describe('Voucher Model', () => {
    it('should generate a valid voucher code', () => {
      const code = Voucher.generateCode();

      expect(code).toHaveLength(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should create a voucher', async () => {
      const voucherData = {
        router_id: 1,
        package_id: 1,
        payment_id: 1,
        customer_phone: '+256700000000'
      };

      // Mock package duration lookup
      pool.execute
        .mockResolvedValueOnce([[{ duration_hours: 24 }]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await Voucher.create(voucherData);

      expect(pool.execute).toHaveBeenNthCalledWith(1,
        'SELECT duration_hours FROM packages WHERE id = ?',
        [1]
      );
      expect(pool.execute).toHaveBeenNthCalledWith(2,
        'INSERT INTO vouchers (code, router_id, package_id, payment_id, customer_phone, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [expect.any(String), 1, 1, 1, '+256700000000', expect.any(Date)]
      );
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('expires_at');
    });

    it('should find voucher by code', async () => {
      const mockVoucher = {
        id: 1,
        code: 'ABC12345',
        router_id: 1,
        package_id: 1,
        status: 'active'
      };

      pool.execute.mockResolvedValue([[mockVoucher]]);

      const result = await Voucher.findByCode('ABC12345');

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT v.*, r.name as router_name, p.name as package_name, p.duration_hours FROM vouchers v JOIN routers r ON v.router_id = r.id JOIN packages p ON v.package_id = p.id WHERE v.code = ?',
        ['ABC12345']
      );
      expect(result).toEqual(mockVoucher);
    });
  });

  describe('Package Model', () => {
    it('should find package by ID', async () => {
      const mockPackage = {
        id: 1,
        name: 'Daily',
        duration_hours: 24,
        price_ugx: 1000
      };

      pool.execute.mockResolvedValue([[mockPackage]]);

      const result = await Package.findById(1);

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM packages WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockPackage);
    });
  });
});