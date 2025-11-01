const Router = require('../models/Router');
const Package = require('../models/Package');
const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const SmsLog = require('../models/SmsLog');
const OmadaAPI = require('../utils/omadaApi');
const africasTalking = require('../utils/africasTalking');
const smsFallback = require('../utils/smsFallback');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [paymentStats] = await Payment.getRevenueStats();
    const [voucherStats] = await Voucher.getVoucherStats();
    const [smsStats] = await SmsLog.getSmsStats();
    const routerStats = await Router.getRouterStats();

    res.json({
      revenue: paymentStats,
      vouchers: voucherStats,
      sms: smsStats,
      routers: routerStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Router management
const getRouters = async (req, res) => {
  try {
    const routers = await Router.getAll();
    res.json(routers);
  } catch (error) {
    console.error('Get routers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createRouter = async (req, res) => {
  try {
    const { name, location, omada_controller_url, omada_username, omada_password } = req.body;

    if (!name || !omada_controller_url || !omada_username || !omada_password) {
      return res.status(400).json({ error: 'Name, controller URL, username, and password are required' });
    }

    const routerId = await Router.create({
      name,
      location,
      omada_controller_url,
      omada_username,
      omada_password
    });

    const router = await Router.findById(routerId);
    res.status(201).json(router);
  } catch (error) {
    console.error('Create router error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateRouter = async (req, res) => {
  try {
    const { id } = req.params;
    const routerData = req.body;

    const router = await Router.findById(id);
    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    await Router.update(id, routerData);
    const updatedRouter = await Router.findById(id);

    res.json(updatedRouter);
  } catch (error) {
    console.error('Update router error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteRouter = async (req, res) => {
  try {
    const { id } = req.params;

    const router = await Router.findById(id);
    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    await Router.delete(id);
    res.json({ message: 'Router deleted successfully' });
  } catch (error) {
    console.error('Delete router error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const testRouterConnection = async (req, res) => {
  try {
    const { id } = req.params;

    const router = await Router.getRouterWithCredentials(id);
    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    const omadaApi = new OmadaAPI(
      router.omada_controller_url,
      router.omada_username,
      router.omada_password
    );

    try {
      const controllerInfo = await omadaApi.getControllerInfo();
      res.json({
        status: 'connected',
        controller_info: controllerInfo
      });
    } catch (apiError) {
      res.json({
        status: 'failed',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Test router connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Package management
const getPackages = async (req, res) => {
  try {
    const packages = await Package.getAll();
    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPackage = async (req, res) => {
  try {
    const { name, duration_hours, price_ugx, description } = req.body;

    if (!name || !duration_hours || !price_ugx) {
      return res.status(400).json({ error: 'Name, duration hours, and price are required' });
    }

    const packageId = await Package.create({
      name,
      duration_hours,
      price_ugx,
      description
    });

    const package = await Package.findById(packageId);
    res.status(201).json(package);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const packageData = req.body;

    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await Package.update(id, packageData);
    const updatedPackage = await Package.findById(id);

    res.json(updatedPackage);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await Package.delete(id);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Payment management
const getPayments = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const payments = await Payment.getAll(parseInt(limit), parseInt(offset));
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const [stats] = await Payment.getRevenueStats();
    res.json(stats);
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Voucher management
const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.getActiveVouchers();
    res.json(vouchers);
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getVoucherStats = async (req, res) => {
  try {
    const [stats] = await Voucher.getVoucherStats();
    res.json(stats);
  } catch (error) {
    console.error('Get voucher stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// SMS management
const getSmsLogs = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const smsLogs = await SmsLog.getAll(parseInt(limit), parseInt(offset));
    res.json(smsLogs);
  } catch (error) {
    console.error('Get SMS logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSmsStats = async (req, res) => {
  try {
    const [stats] = await SmsLog.getSmsStats();
    res.json(stats);
  } catch (error) {
    console.error('Get SMS stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const checkSmsBalance = async (req, res) => {
  try {
    // Check balances across all providers
    const balances = await smsFallback.checkBalances();
    res.json(balances);
  } catch (error) {
    console.error('Check SMS balance error:', error);
    res.status(500).json({ error: 'Failed to check SMS balances' });
  }
};

module.exports = {
  getDashboardStats,
  getRouters,
  createRouter,
  updateRouter,
  deleteRouter,
  testRouterConnection,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPayments,
  getPaymentStats,
  getVouchers,
  getVoucherStats,
  getSmsLogs,
  getSmsStats,
  checkSmsBalance
};