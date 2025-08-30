const db = require('../database');

class User {
  // Lấy tất cả users
  static getAll() {
    const stmt = db.prepare('SELECT id, name, email, phone, role, status, createdAt FROM users');
    return stmt.all();
  }

  // Lấy user theo ID
  static getById(id) {
    const stmt = db.prepare('SELECT id, name, email, phone, role, status, createdAt FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // Lấy user theo email
  static getByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  // Tạo user mới
  static create(userData) {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, phone, password, role, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userData.id,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.role || 'user',
      userData.status || 'active',
      userData.createdAt || new Date().toISOString()
    );
    
    return result.lastInsertRowid;
  }

  // Cập nhật user
  static update(id, userData) {
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, role = ?, status = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      userData.name,
      userData.email,
      userData.phone,
      userData.role,
      userData.status,
      id
    );
    
    return result.changes > 0;
  }

  // Cập nhật password
  static updatePassword(id, newPassword) {
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    const result = stmt.run(newPassword, id);
    return result.changes > 0;
  }

  // Xóa user
  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Kiểm tra email đã tồn tại
  static emailExists(email, excludeId = null) {
    let stmt;
    if (excludeId) {
      stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?');
      const result = stmt.get(email, excludeId);
      return result.count > 0;
    } else {
      stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
      const result = stmt.get(email);
      return result.count > 0;
    }
  }

  // Lấy số lượng users
  static getCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    return result.count;
  }

  // Lấy users theo role
  static getByRole(role) {
    const stmt = db.prepare('SELECT id, name, email, phone, role, status, createdAt FROM users WHERE role = ?');
    return stmt.all(role);
  }

  // Lấy users theo status
  static getByStatus(status) {
    const stmt = db.prepare('SELECT id, name, email, phone, role, status, createdAt FROM users WHERE status = ?');
    return stmt.all(status);
  }
}

module.exports = User;
