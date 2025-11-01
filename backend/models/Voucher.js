const { pool } = require('../config/database');

class Voucher {
  static generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async create(voucherData) {
    const { router_id, package_id, payment_id, customer_phone } = voucherData;
    const code = this.generateCode();

    // Calculate expiry date based on package duration
    const [packageInfo] = await pool.execute(
      'SELECT duration_hours FROM packages WHERE id = ?',
      [package_id]
    );

    if (!packageInfo[0]) {
      throw new Error('Package not found');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + packageInfo[0].duration_hours);

    const [result] = await pool.execute(
      'INSERT INTO vouchers (code, router_id, package_id, payment_id, customer_phone, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [code, router_id, package_id, payment_id, customer_phone, expiresAt]
    );

    return {
      id: result.insertId,
      code,
      expires_at: expiresAt
    };
  }

  static async findByCode(code) {
    const [rows] = await pool.execute(
      'SELECT v.*, r.name as router_name, p.name as package_name, p.duration_hours FROM vouchers v JOIN routers r ON v.router_id = r.id JOIN packages p ON v.package_id = p.id WHERE v.code = ?',
      [code]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT v.*, r.name as router_name, p.name as package_name, p.duration_hours FROM vouchers v JOIN routers r ON v.router_id = r.id JOIN packages p ON v.package_id = p.id WHERE v.id = ?',
      [id]
    );
    return rows[0];
  }

  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE vouchers SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async getActiveVouchers() {
    const [rows] = await pool.execute(
      'SELECT v.*, r.name as router_name, p.name as package_name FROM vouchers v JOIN routers r ON v.router_id = r.id JOIN packages p ON v.package_id = p.id WHERE v.status = "active" AND v.expires_at > NOW() ORDER BY v.created_at DESC'
    );
    return rows;
  }

  static async getExpiredVouchers() {
    const [rows] = await pool.execute(
      'UPDATE vouchers SET status = "expired" WHERE status = "active" AND expires_at <= NOW()'
    );
    return rows.affectedRows;
  }

  static async getVoucherStats() {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vouchers,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used_vouchers,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_vouchers,
        COUNT(*) as total_vouchers
      FROM vouchers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    return rows[0];
  }

  static async getVouchersByRouter(routerId) {
    const [rows] = await pool.execute(
      'SELECT v.*, p.name as package_name FROM vouchers v JOIN packages p ON v.package_id = p.id WHERE v.router_id = ? ORDER BY v.created_at DESC',
      [routerId]
    );
    return rows;
  }
}

module.exports = Voucher;