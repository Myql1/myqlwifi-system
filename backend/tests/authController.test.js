const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../models/User');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      req.body = {
        username: 'admin',
        password: 'password'
      };

      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true
      };

      const mockToken = 'jwt-token-123';

      User.findByUsername.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);

      await authController.login(req, res);

      expect(User.findByUsername).toHaveBeenCalledWith('admin');
      expect(User.verifyPassword).toHaveBeenCalledWith('password', undefined);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, username: 'admin', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: mockToken,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        }
      });
    });

    it('should return error for invalid username', async () => {
      req.body = {
        username: 'invalid',
        password: 'password'
      };

      User.findByUsername.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return error for invalid password', async () => {
      req.body = {
        username: 'admin',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        username: 'admin',
        password_hash: 'hashed-password'
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return error for inactive user', async () => {
      req.body = {
        username: 'admin',
        password: 'password'
      };

      const mockUser = {
        id: 1,
        username: 'admin',
        is_active: false
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is deactivated' });
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      req.body = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        role: 'admin'
      };

      const mockUserId = 2;
      const mockUser = {
        id: 2,
        username: 'newadmin',
        email: 'newadmin@example.com',
        role: 'admin'
      };

      User.findByUsername.mockResolvedValue(null);
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUserId);
      User.findById.mockResolvedValue(mockUser);

      await authController.register(req, res);

      expect(User.findByUsername).toHaveBeenCalledWith('newadmin');
      expect(User.findByEmail).toHaveBeenCalledWith('newadmin@example.com');
      expect(User.create).toHaveBeenCalledWith({
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        role: 'admin'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: mockUser
      });
    });

    it('should return error for existing username', async () => {
      req.body = {
        username: 'existing',
        email: 'new@example.com',
        password: 'password123'
      };

      User.findByUsername.mockResolvedValue({ id: 1, username: 'existing' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username already exists' });
    });

    it('should return error for existing email', async () => {
      req.body = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findByUsername.mockResolvedValue(null);
      User.findByEmail.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      req.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      });
    });
  });
});