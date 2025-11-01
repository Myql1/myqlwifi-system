const { pool } = require('../config/database');

class Package {
  static async create(packageData) {
    const { name, duration_hours, price_ugx, description } = packageData;

    const [result] = await pool.execute(
      'INSERT INTO packages (name, duration_hours, price_ugx, description) VALUES (?, ?, ?, ?)',
      [name, duration_hours, price_ugx, description]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM packages WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async getAll(activeOnly = true) {
    const query = activeOnly
      ? 'SELECT * FROM packages WHERE is_active = true ORDER BY price_ugx ASC'
      : 'SELECT * FROM packages ORDER BY price_ugx ASC';

    const [rows] = await pool.execute(query);
    return rows;
  }

  static async update(id, packageData) {
    const { name, duration_hours, price_ugx, description, is_active } = packageData;
    const updateFields = [];
    const values = [];

    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (duration_hours !== undefined) {
      updateFields.push('duration_hours = ?');
      values.push(duration_hours);
    }
    if (price_ugx !== undefined) {
      updateFields.push('price_ugx = ?');
      values.push(price_ugx);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(is_active);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE packages SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM packages WHERE id = ?', [id]);
  }
}

module.exports = Package;