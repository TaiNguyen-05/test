const db = require('../database');

class Movie {
  // Lấy tất cả movies
  static getAll() {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      WHERE m.status = 'active'
      ORDER BY m.createdAt DESC
    `);
    const movies = stmt.all();
    
    // Lấy categories cho từng movie
    return movies.map(movie => {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
      return movie;
    });
  }

  // Lấy tất cả movies (admin)
  static getAllForAdmin() {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      ORDER BY m.createdAt DESC
    `);
    const movies = stmt.all();
    
    // Lấy categories cho từng movie
    return movies.map(movie => {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
      return movie;
    });
  }

  // Lấy movie theo ID
  static getById(id) {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      WHERE m.id = ?
    `);
    const movie = stmt.get(id);
    
    if (movie) {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
    }
    
    return movie;
  }

  // Tạo movie mới
  static create(movieData) {
    const stmt = db.prepare(`
      INSERT INTO movies (title, genre, duration, rating, image, description, trailer, subtitles, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      movieData.title,
      movieData.genre || movieData.categoryId, // Sử dụng categoryId nếu không có genre
      movieData.duration,
      movieData.rating,
      movieData.poster || movieData.image, // Sử dụng poster nếu có, fallback về image
      movieData.description,
      movieData.trailer,
      movieData.subtitles,
      movieData.status || 'active',
      movieData.createdAt || new Date().toISOString()
    );
    
    const movieId = result.lastInsertRowid;
    
    // Thêm categories nếu có
    if (movieData.categoryIds && movieData.categoryIds.length > 0) {
      this.addCategories(movieId, movieData.categoryIds);
    } else if (movieData.categoryId) {
      // Nếu chỉ có một categoryId
      this.addCategories(movieId, [movieData.categoryId]);
    }
    
    return movieId;
  }

  // Cập nhật movie
  static update(id, movieData) {
    const stmt = db.prepare(`
      UPDATE movies 
      SET title = ?, genre = ?, duration = ?, rating = ?, image = ?, 
          description = ?, trailer = ?, subtitles = ?, status = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      movieData.title,
      movieData.genre,
      movieData.duration,
      movieData.rating,
      movieData.image,
      movieData.description,
      movieData.trailer,
      movieData.subtitles,
      movieData.status,
      id
    );
    
    // Cập nhật categories nếu có
    if (movieData.categoryIds) {
      this.removeAllCategories(id);
      if (movieData.categoryIds.length > 0) {
        this.addCategories(id, movieData.categoryIds);
      }
    }
    
    return result.changes > 0;
  }

  // Xóa movie
  static delete(id) {
    const stmt = db.prepare('DELETE FROM movies WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Thêm categories cho movie
  static addCategories(movieId, categoryIds) {
    const stmt = db.prepare('INSERT INTO movie_categories (movieId, categoryId) VALUES (?, ?)');
    categoryIds.forEach(categoryId => {
      stmt.run(movieId, categoryId);
    });
  }

  // Xóa tất cả categories của movie
  static removeAllCategories(movieId) {
    const stmt = db.prepare('DELETE FROM movie_categories WHERE movieId = ?');
    stmt.run(movieId);
  }

  // Lấy movies theo category
  static getByCategory(categoryId) {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      INNER JOIN movie_categories mc ON m.id = mc.movieId
      WHERE mc.categoryId = ? AND m.status = 'active'
      ORDER BY m.createdAt DESC
    `);
    const movies = stmt.all(categoryId);
    
    // Lấy categories cho từng movie
    return movies.map(movie => {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
      return movie;
    });
  }

  // Tìm kiếm movies
  static search(query) {
    const searchQuery = `%${query}%`;
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      WHERE (m.title LIKE ? OR m.description LIKE ? OR m.genre LIKE ?) 
        AND m.status = 'active'
      ORDER BY m.createdAt DESC
    `);
    const movies = stmt.all(searchQuery, searchQuery, searchQuery);
    
    // Lấy categories cho từng movie
    return movies.map(movie => {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
      return movie;
    });
  }

  // Lấy số lượng movies
  static getCount() {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM movies WHERE status = 'active'");
    const result = stmt.get();
    return result.count;
  }

  // Lấy movies theo status
  static getByStatus(status) {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      WHERE m.status = ?
      ORDER BY m.createdAt DESC
    `);
    const movies = stmt.all(status);
    
    // Lấy categories cho từng movie
    return movies.map(movie => {
      const categoryStmt = db.prepare(`
        SELECT c.name FROM categories c
        INNER JOIN movie_categories mc ON c.id = mc.categoryId
        WHERE mc.movieId = ?
      `);
      const categories = categoryStmt.all(movie.id);
      movie.categories = categories.map(c => c.name).join(', ');
      return movie;
    });
  }
}

module.exports = Movie;
