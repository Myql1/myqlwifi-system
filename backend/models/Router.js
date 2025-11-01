const { pool } = require('../config/database');

class Router {
  static async create(routerData) {
    const { name, location, omada_controller_url, omada_username, omada_password } = routerData;

    const [result] = await pool.execute(
      'INSERT INTO routers (name, location, omada_controller_url, omada_username, omada_password) VALUES (?, ?, ?, ?, ?)',
      [name, location, omada_controller_url, omada_username, omada_password]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, location, omada_controller_url, omada_username, is_active, created_at, updated_at FROM routers WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async getAll(activeOnly = true) {
    const query = activeOnly
      ? 'SELECT id, name, location, omada_controller_url, omada_username, is_active, created_at, updated_at FROM routers WHERE is_active = true ORDER BY created_at DESC'
      : 'SELECT id, name, location, omada_controller_url, omada_username, is_active, created_at, updated_at FROM routers ORDER BY created_at DESC';

    const [rows] = await pool.execute(query);
    return rows;
  }

  static async update(id, routerData) {
    const { name, location, omada_controller_url, omada_username, omada_password, is_active } = routerData;
    const updateFields = [];
    const values = [];

    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (location) {
      updateFields.push('location = ?');
      values.push(location);
    }
    if (omada_controller_url) {
      updateFields.push('omada_controller_url = ?');
      values.push(omada_controller_url);
    }
    if (omada_username) {
      updateFields.push('omada_username = ?');
      values.push(omada_username);
    }
    if (omada_password) {
      updateFields.push('omada_password = ?');
      values.push(omada_password);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(is_active);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE routers SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM routers WHERE id = ?', [id]);
  }

  static async getRouterStats() {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) as total_routers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_routers,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_routers
      FROM routers
    `);
    return rows[0];
  }

  static async getRouterWithCredentials(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM routers WHERE id = ?',
      [id]
    );
    return rows[0];
  }
}

module.exports = Router;