const db = require('../database');

class Showtime {
  // Lấy tất cả showtimes
  static getAll() {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.status = 'active' AND m.status = 'active'
      ORDER BY s.date, s.time
    `);
    return stmt.all();
  }

  // Lấy tất cả showtimes (admin)
  static getAllForAdmin() {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      ORDER BY s.date, s.time
    `);
    return stmt.all();
  }

  // Lấy showtime theo ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.id = ?
    `);
    return stmt.get(id);
  }

  // Lấy showtimes theo movie ID
  static getByMovieId(movieId) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.movieId = ? AND s.status = 'active' AND m.status = 'active'
      ORDER BY s.date, s.time
    `);
    return stmt.all(movieId);
  }

  // Lấy thông tin ghế cho showtime
  static getSeats(showtimeId) {
    // Tạo sơ đồ ghế 12x8 (96 ghế)
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    // Lấy ghế đã đặt cho showtime này
    const stmt = db.prepare(`
      SELECT DISTINCT b.seats
      FROM bookings b
      WHERE b.showtimeId = ? AND b.status != 'cancelled'
    `);
    const bookedSeats = stmt.all(showtimeId);
    
    // Tạo danh sách ghế đã đặt
    const occupiedSeats = new Set();
    bookedSeats.forEach(booking => {
      if (booking.seats) {
        const seatList = booking.seats.split(',');
        seatList.forEach(seat => {
          occupiedSeats.add(seat.trim());
        });
      }
    });
    
    // Tạo sơ đồ ghế
    rows.forEach(row => {
      for (let col = 1; col <= 12; col++) {
        const seatNumber = `${row}${col}`;
        seats.push({
          seatNumber: seatNumber,
          isOccupied: occupiedSeats.has(seatNumber)
        });
      }
    });
    
    return seats;
  }

  // Lấy showtimes theo ngày
  static getByDate(date) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.date = ? AND s.status = 'active' AND m.status = 'active'
      ORDER BY s.time
    `);
    return stmt.all(date);
  }

  // Tạo showtime mới
  static create(showtimeData) {
    const stmt = db.prepare(`
      INSERT INTO showtimes (movieId, time, date, price, availableSeats, maxSeats, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      showtimeData.movieId,
      showtimeData.time,
      showtimeData.date,
      showtimeData.price,
      showtimeData.availableSeats || showtimeData.maxSeats,
      showtimeData.maxSeats,
      showtimeData.status || 'active'
    );
    
    return result.lastInsertRowid;
  }

  // Cập nhật showtime
  static update(id, showtimeData) {
    const stmt = db.prepare(`
      UPDATE showtimes 
      SET movieId = ?, time = ?, date = ?, price = ?, 
          availableSeats = ?, maxSeats = ?, status = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      showtimeData.movieId,
      showtimeData.time,
      showtimeData.date,
      showtimeData.price,
      showtimeData.availableSeats,
      showtimeData.maxSeats,
      showtimeData.status,
      id
    );
    
    return result.changes > 0;
  }

  // Xóa showtime
  static delete(id) {
    const stmt = db.prepare('DELETE FROM showtimes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Cập nhật số ghế còn lại
  static updateAvailableSeats(id, seats) {
    const stmt = db.prepare('UPDATE showtimes SET availableSeats = availableSeats - ? WHERE id = ?');
    const result = stmt.run(seats, id);
    return result.changes > 0;
  }

  // Hoàn trả số ghế (khi hủy vé)
  static refundSeats(id, seats) {
    const stmt = db.prepare('UPDATE showtimes SET availableSeats = availableSeats + ? WHERE id = ?');
    const result = stmt.run(seats, id);
    return result.changes > 0;
  }

  // Kiểm tra showtime có đủ ghế không
  static hasEnoughSeats(id, requiredSeats) {
    const stmt = db.prepare('SELECT availableSeats FROM showtimes WHERE id = ?');
    const showtime = stmt.get(id);
    return showtime && showtime.availableSeats >= requiredSeats;
  }

  // Lấy số lượng showtimes
  static getCount() {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM showtimes WHERE status = 'active'");
    const result = stmt.get();
    return result.count;
  }

  // Lấy showtimes theo status
  static getByStatus(status) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.status = ?
      ORDER BY s.date, s.time
    `);
    return stmt.all(status);
  }

  // Lấy showtimes theo khoảng thời gian
  static getByDateRange(startDate, endDate) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.date BETWEEN ? AND ? AND s.status = 'active' AND m.status = 'active'
      ORDER BY s.date, s.time
    `);
    return stmt.all(startDate, endDate);
  }

  // Lấy showtimes theo giá
  static getByPriceRange(minPrice, maxPrice) {
    const stmt = db.prepare(`
      SELECT s.*, m.title as movieTitle, m.image as movieImage, m.duration as movieDuration
      FROM showtimes s
      INNER JOIN movies m ON s.movieId = m.id
      WHERE s.price BETWEEN ? AND ? AND s.status = 'active' AND m.status = 'active'
      ORDER BY s.price, s.date, s.time
    `);
    return stmt.all(minPrice, maxPrice);
  }
}

module.exports = Showtime;
