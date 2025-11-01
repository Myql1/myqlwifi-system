const { pool } = require('../config/database');

class SmsLog {
  static async create(smsData) {
    const { phone, message, status = 'sent', provider = 'africas_talking', reference_id } = smsData;

    const [result] = await pool.execute(
      'INSERT INTO sms_logs (phone, message, status, provider, reference_id) VALUES (?, ?, ?, ?, ?)',
      [phone, message, status, provider, reference_id]
    );

    return result.insertId;
  }

  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE sms_logs SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async getAll(limit = 100, offset = 0) {
    const [rows] = await pool.execute(
      'SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  }

  static async getByPhone(phone) {
    const [rows] = await pool.execute(
      'SELECT * FROM sms_logs WHERE phone = ? ORDER BY created_at DESC',
      [phone]
    );
    return rows;
  }

  static async getSmsStats() {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) as total_sms,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_sms,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_sms,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_sms
      FROM sms_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    return rows[0];
  }

  static async getRecentSms(limit = 50) {
    const [rows] = await pool.execute(
      'SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  }
}

module.exports = SmsLog;