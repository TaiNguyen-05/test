const db = require('../database');

class Activity {
  // Lấy tất cả activities
  static getAll(limit = 100) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      ORDER BY a.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // Lấy activity theo ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.id = ?
    `);
    return stmt.get(id);
  }

  // Lấy activities theo user ID
  static getByUserId(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.userId = ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  // Lấy activities theo type
  static getByType(type, limit = 50) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.type = ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(type, limit);
  }

  // Tạo activity mới
  static create(activityData) {
    const stmt = db.prepare(`
      INSERT INTO activities (id, type, description, userId, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      activityData.id,
      activityData.type,
      activityData.description,
      activityData.userId || null,
      activityData.timestamp || new Date().toISOString()
    );
    
    return result.lastInsertRowid;
  }

  // Xóa activity
  static delete(id) {
    const stmt = db.prepare('DELETE FROM activities WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Xóa activities cũ (giữ lại n activities gần nhất)
  static cleanupOld(keepCount = 100) {
    const stmt = db.prepare(`
      DELETE FROM activities 
      WHERE id NOT IN (
        SELECT id FROM activities 
        ORDER BY timestamp DESC 
        LIMIT ?
      )
    `);
    const result = stmt.run(keepCount);
    return result.changes;
  }

  // Lấy số lượng activities
  static getCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM activities');
    const result = stmt.get();
    return result.count;
  }

  // Lấy activities theo khoảng thời gian
  static getByDateRange(startDate, endDate) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.timestamp BETWEEN ? AND ?
      ORDER BY a.timestamp DESC
    `);
    return stmt.all(startDate, endDate);
  }

  // Lấy thống kê activities theo type
  static getTypeStats() {
    const stmt = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        MIN(timestamp) as firstOccurrence,
        MAX(timestamp) as lastOccurrence
      FROM activities
      GROUP BY type
      ORDER BY count DESC
    `);
    return stmt.all();
  }

  // Lấy thống kê activities theo ngày
  static getDailyStats(days = 7) {
    const stmt = db.prepare(`
      SELECT 
        timestamp,
        COUNT(*) as totalActivities,
        COUNT(DISTINCT userId) as uniqueUsers,
        COUNT(DISTINCT type) as uniqueTypes
      FROM activities
      WHERE timestamp >= DATE('now', '-' || ? || ' days')
      GROUP BY timestamp
      ORDER BY timestamp DESC
    `);
    return stmt.all(days);
  }

  // Lấy thống kê activities theo user
  static getUserStats() {
    const stmt = db.prepare(`
      SELECT 
        u.name as userName,
        u.email as userEmail,
        COUNT(a.id) as activityCount,
        MIN(a.timestamp) as firstActivity,
        MAX(a.timestamp) as lastActivity
      FROM users u
      LEFT JOIN activities a ON u.id = a.userId
      GROUP BY u.id, u.name, u.email
      ORDER BY activityCount DESC
    `);
    return stmt.all();
  }

  // Tìm kiếm activities
  static search(query, limit = 50) {
    const searchQuery = `%${query}%`;
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.type LIKE ? OR a.description LIKE ? OR u.name LIKE ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(searchQuery, searchQuery, searchQuery, limit);
  }

  // Lấy activities theo thời gian gần đây
  static getRecent(hours = 24) {
    const stmt = db.prepare(`
      SELECT a.*, u.name as userName, u.email as userEmail
      FROM activities a
      LEFT JOIN users u ON a.userId = u.id
      WHERE a.timestamp >= DATETIME('now', '-' || ? || ' hours')
      ORDER BY a.timestamp DESC
    `);
    return stmt.all(hours);
  }
}

module.exports = Activity;
