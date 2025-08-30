const db = require('../database');

class Category {
  // Lấy tất cả categories
  static getAll() {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    return stmt.all();
  }

  // Lấy category theo ID
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id);
  }

  // Lấy category theo name
  static getByName(name) {
    const stmt = db.prepare('SELECT * FROM categories WHERE name = ?');
    return stmt.get(name);
  }

  // Tạo category mới
  static create(categoryData) {
    const stmt = db.prepare(`
      INSERT INTO categories (name, description, color, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      categoryData.name,
      categoryData.description,
      categoryData.color,
      categoryData.createdAt || new Date().toISOString()
    );
    
    return result.lastInsertRowid;
  }

  // Cập nhật category
  static update(id, categoryData) {
    const stmt = db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, color = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      categoryData.name,
      categoryData.description,
      categoryData.color,
      id
    );
    
    return result.changes > 0;
  }

  // Xóa category
  static delete(id) {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Kiểm tra category có được sử dụng không
  static isUsed(id) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM movie_categories WHERE categoryId = ?');
    const result = stmt.get(id);
    return result.count > 0;
  }

  // Lấy số lượng categories
  static getCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM categories');
    const result = stmt.get();
    return result.count;
  }

  // Lấy categories với số lượng movies
  static getAllWithMovieCount() {
    const stmt = db.prepare(`
      SELECT c.*
      FROM categories c
      ORDER BY c.name
    `);
    const categories = stmt.all();
    
    // Lấy số lượng movies cho từng category
    return categories.map(category => {
      const countStmt = db.prepare(`
        SELECT COUNT(*) as movieCount
        FROM movie_categories mc
        WHERE mc.categoryId = ?
      `);
      const result = countStmt.get(category.id);
      category.movieCount = result.movieCount;
      return category;
    });
  }

  // Lấy categories theo tên (tìm kiếm)
  static search(query) {
    const searchQuery = `%${query}%`;
    const stmt = db.prepare('SELECT * FROM categories WHERE name LIKE ? OR description LIKE ? ORDER BY name');
    return stmt.all(searchQuery, searchQuery);
  }

  // Lấy categories theo màu
  static getByColor(color) {
    const stmt = db.prepare('SELECT * FROM categories WHERE color = ?');
    return stmt.all(color);
  }

  // Cập nhật màu cho category
  static updateColor(id, color) {
    const stmt = db.prepare('UPDATE categories SET color = ? WHERE id = ?');
    const result = stmt.run(color, id);
    return result.changes > 0;
  }
}

module.exports = Category;
