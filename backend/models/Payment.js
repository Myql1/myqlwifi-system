const { pool } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const { transaction_id, customer_phone, provider, package_id, amount } = paymentData;

    const [result] = await pool.execute(
      'INSERT INTO payments (transaction_id, customer_phone, provider, package_id, amount) VALUES (?, ?, ?, ?, ?)',
      [transaction_id, customer_phone, provider, package_id, amount]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT p.*, pkg.name as package_name, pkg.duration_hours FROM payments p JOIN packages pkg ON p.package_id = pkg.id WHERE p.id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByTransactionId(transactionId) {
    const [rows] = await pool.execute(
      'SELECT p.*, pkg.name as package_name, pkg.duration_hours FROM payments p JOIN packages pkg ON p.package_id = pkg.id WHERE p.transaction_id = ?',
      [transactionId]
    );
    return rows[0];
  }

  static async updateStatus(id, status, paymentReference = null) {
    const updateFields = ['status = ?'];
    const values = [status];

    if (paymentReference) {
      updateFields.push('payment_reference = ?');
      values.push(paymentReference);
    }

    values.push(id);
    await pool.execute(
      `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async getAll(limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      'SELECT p.*, pkg.name as package_name FROM payments p JOIN packages pkg ON p.package_id = pkg.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await pool.execute(
      'SELECT p.*, pkg.name as package_name FROM payments p JOIN packages pkg ON p.package_id = pkg.id WHERE p.status = ? ORDER BY p.created_at DESC',
      [status]
    );
    return rows;
  }

  static async getRevenueStats() {
    const [rows] = await pool.execute(`
      SELECT
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment_amount
      FROM payments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    return rows[0];
  }

  static async getPaymentsByDateRange(startDate, endDate) {
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
    return rows;
  }
}

module.exports = Payment;