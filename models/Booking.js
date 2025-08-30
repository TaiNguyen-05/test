const db = require('../database');

class Booking {
  // Lấy tất cả bookings
  static getAll() {
    const stmt = db.prepare(`
      SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
             s.time, s.date, s.price as showtimePrice,
             m.title as movieTitle, m.image as movieImage
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      ORDER BY b.createdAt DESC
    `);
    return stmt.all();
  }

  // Lấy booking theo ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
             s.time, s.date, s.price as showtimePrice,
             m.title as movieTitle, m.image as movieImage
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      WHERE b.id = ?
    `);
    return stmt.get(id);
  }

  // Lấy bookings theo user ID
  static getByUserId(userId) {
    const stmt = db.prepare(`
      SELECT b.*, s.time, s.date, s.price as showtimePrice,
             m.title as movieTitle, m.image as movieImage
      FROM bookings b
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC
    `);
    return stmt.all(userId);
  }

  // Lấy bookings theo showtime ID
  static getByShowtimeId(showtimeId) {
    const stmt = db.prepare(`
      SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      WHERE b.showtimeId = ?
      ORDER BY b.createdAt
    `);
    return stmt.all(showtimeId);
  }

  // Lấy bookings theo status
  static getByStatus(status) {
    const stmt = db.prepare(`
      SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
             s.time, s.date, s.price as showtimePrice,
             m.title as movieTitle, m.image as movieImage
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      WHERE b.status = ?
      ORDER BY b.createdAt DESC
    `);
    return stmt.all(status);
  }

  // Tạo booking mới
  static create(bookingData) {
    const stmt = db.prepare(`
      INSERT INTO bookings (id, userId, showtimeId, movieTitle, seats, totalPrice, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      bookingData.id,
      bookingData.userId,
      bookingData.showtimeId,
      bookingData.movieTitle,
      JSON.stringify(bookingData.seats),
      bookingData.totalPrice,
      bookingData.status || 'confirmed',
      bookingData.createdAt || new Date().toISOString()
    );
    
    return result.lastInsertRowid;
  }

  // Cập nhật booking
  static update(id, bookingData) {
    const stmt = db.prepare(`
      UPDATE bookings 
      SET status = ?, seats = ?, totalPrice = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      bookingData.status,
      JSON.stringify(bookingData.seats),
      bookingData.totalPrice,
      id
    );
    
    return result.changes > 0;
  }

  // Cập nhật status của booking
  static updateStatus(id, status) {
    const stmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  // Hủy vé (cập nhật status thành cancelled)
  static cancel(id) {
    const stmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ?');
    const result = stmt.run('cancelled', id);
    return result.changes > 0;
  }

  // Xóa booking
  static delete(id) {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Lấy số lượng bookings
  static getCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM bookings');
    const result = stmt.get();
    return result.count;
  }

  // Lấy số lượng bookings theo status
  static getCountByStatus(status) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?');
    const result = stmt.get(status);
    return result.count;
  }

  // Lấy bookings theo khoảng thời gian
  static getByDateRange(startDate, endDate) {
    const stmt = db.prepare(`
      SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
             s.time, s.date, s.price as showtimePrice,
             m.title as movieTitle, m.image as movieImage
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.date BETWEEN ? AND ?
      ORDER BY b.createdAt DESC
    `);
    return stmt.all(startDate, endDate);
  }

  // Lấy thống kê bookings theo ngày
  static getDailyStats(days = 7) {
    const stmt = db.prepare(`
      SELECT 
        s.date,
        COUNT(*) as totalBookings,
        SUM(b.totalPrice) as totalRevenue,
        COUNT(DISTINCT b.userId) as uniqueUsers
      FROM bookings b
      INNER JOIN showtimes s ON b.showtimeId = s.id
      WHERE s.date >= DATE('now', '-' || ? || ' days')
      GROUP BY s.date
      ORDER BY s.date DESC
    `);
    return stmt.all(days);
  }

  // Lấy thống kê bookings theo movie
  static getMovieStats() {
    const stmt = db.prepare(`
      SELECT 
        m.title as movieTitle,
        COUNT(b.id) as totalBookings,
        SUM(b.totalPrice) as totalRevenue,
        COUNT(DISTINCT b.userId) as uniqueUsers
      FROM bookings b
      INNER JOIN showtimes s ON b.showtimeId = s.id
      INNER JOIN movies m ON s.movieId = m.id
      GROUP BY m.id, m.title
      ORDER BY totalRevenue DESC
    `);
    return stmt.all();
  }

  // Kiểm tra user đã đặt vé cho showtime này chưa
  static hasUserBooked(userId, showtimeId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE userId = ? AND showtimeId = ?');
    const result = stmt.get(userId, showtimeId);
    return result.count > 0;
  }

  // Lấy tổng doanh thu
  static getTotalRevenue() {
    const stmt = db.prepare("SELECT SUM(totalPrice) as total FROM bookings WHERE status = 'confirmed'");
    const result = stmt.get();
    return result.total || 0;
  }
}

module.exports = Booking;
