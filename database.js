const Database = require('better-sqlite3');
const path = require('path');

// Tạo kết nối database
const dbPath = path.join(__dirname, 'cinema.db');
const db = new Database(dbPath);

// Bật foreign keys
db.pragma('foreign_keys = ON');

// Tạo các bảng
function initializeDatabase() {
  console.log('Đang khởi tạo database...');
  
  // Bảng users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng movies
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT,
      duration TEXT,
      rating TEXT,
      image TEXT,
      description TEXT,
      trailer TEXT,
      subtitles TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng movie_categories (many-to-many relationship)
  db.exec(`
    CREATE TABLE IF NOT EXISTS movie_categories (
      movieId INTEGER,
      categoryId INTEGER,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (movieId, categoryId)
    )
  `);

  // Bảng showtimes
  db.exec(`
    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movieId INTEGER NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      price INTEGER NOT NULL,
      availableSeats INTEGER NOT NULL,
      maxSeats INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE
    )
  `);

  // Bảng bookings
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      showtimeId INTEGER NOT NULL,
      movieTitle TEXT NOT NULL,
      seats TEXT NOT NULL,
      totalPrice INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (showtimeId) REFERENCES showtimes(id) ON DELETE CASCADE
    )
  `);

  // Bảng activities (log hoạt động)
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      userId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  console.log('Database đã được khởi tạo thành công!');
}

// Chèn dữ liệu mẫu
function insertSampleData() {
  console.log('Đang chèn dữ liệu mẫu...');
  
  // Kiểm tra xem đã có dữ liệu chưa
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Dữ liệu mẫu đã tồn tại, bỏ qua...');
    return;
  }

  // Chèn admin mặc định
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password, role, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run(
    'admin-001',
    'Admin',
    'admin@cinemabooking.com',
    '+84 123 456 789',
    'admin123',
    'admin',
    'active',
    new Date().toISOString()
  );

  // Chèn categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, description, color, createdAt)
    VALUES (?, ?, ?, ?)
  `);

  const sampleCategories = [
    ['Hành động', 'Phim hành động gay cấn với nhiều cảnh đánh đấm', '#667eea'],
    ['Viễn tưởng', 'Phim khoa học viễn tưởng với công nghệ tương lai', '#764ba2'],
    ['Phiêu lưu', 'Phim phiêu lưu mạo hiểm khám phá thế giới', '#f093fb'],
    ['Siêu anh hùng', 'Phim về các siêu anh hùng với sức mạnh phi thường', '#4facfe'],
    ['Kinh dị', 'Phim kinh dị rùng rợn', '#dc3545'],
    ['Hài', 'Phim hài hước vui nhộn', '#ffc107'],
    ['Tội phạm', 'Phim về tội phạm và điều tra', '#6c757d']
  ];

  sampleCategories.forEach(category => {
    insertCategory.run(category[0], category[1], category[2], new Date().toISOString());
  });

  // Chèn movies
  const insertMovie = db.prepare(`
    INSERT INTO movies (title, genre, duration, rating, image, description, trailer, subtitles, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleMovies = [
    [
      'Avengers: Endgame',
      'Hành động, Viễn tưởng',
      '181 phút',
      '9.0/10',
      'https://via.placeholder.com/300x450/667eea/ffffff?text=Avengers',
      'Khi sự kiện tàn phá thế giới, Avengers phải tập hợp lại để khôi phục cân bằng và cứu lấy tương lai.',
      'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      'Tiếng Việt, English',
      'active',
      new Date('2024-01-01').toISOString()
    ],
    [
      'Spider-Man: No Way Home',
      'Hành động, Phiêu lưu',
      '148 phút',
      '8.8/10',
      'https://via.placeholder.com/300x450/764ba2/ffffff?text=Spider-Man',
      'Spider-Man phải đối mặt với những kẻ thù từ các vũ trụ song song.',
      'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      'Tiếng Việt, English',
      'active',
      new Date('2024-01-02').toISOString()
    ],
    [
      'Black Panther: Wakanda Forever',
      'Hành động, Siêu anh hùng',
      '161 phút',
      '8.5/10',
      'https://via.placeholder.com/300x450/f093fb/ffffff?text=Black+Panther',
      'Wakanda phải đối mặt với những thách thức mới sau cái chết của T\'Challa.',
      'https://www.youtube.com/watch?v=_Z3QKkl1cMc',
      'Tiếng Việt, English',
      'active',
      new Date('2024-01-03').toISOString()
    ]
  ];

  sampleMovies.forEach(movie => {
    insertMovie.run(...movie);
  });

  // Liên kết movies với categories
  const insertMovieCategory = db.prepare(`
    INSERT INTO movie_categories (movieId, categoryId)
    VALUES (?, ?)
  `);

  // Avengers: Endgame - Hành động, Viễn tưởng
  insertMovieCategory.run(1, 1); // Hành động
  insertMovieCategory.run(1, 2); // Viễn tưởng

  // Spider-Man: No Way Home - Hành động, Phiêu lưu
  insertMovieCategory.run(2, 1); // Hành động
  insertMovieCategory.run(2, 3); // Phiêu lưu

  // Black Panther: Wakanda Forever - Hành động, Siêu anh hùng
  insertMovieCategory.run(3, 1); // Hành động
  insertMovieCategory.run(3, 4); // Siêu anh hùng

  // Chèn showtimes
  const insertShowtime = db.prepare(`
    INSERT INTO showtimes (movieId, time, date, price, availableSeats, maxSeats, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleShowtimes = [
    [1, '14:00', '2024-01-15', 120000, 80, 80, 'active'],
    [1, '17:00', '2024-01-15', 120000, 75, 80, 'active'],
    [2, '19:30', '2024-01-15', 110000, 60, 80, 'active'],
    [3, '20:00', '2024-01-15', 130000, 80, 80, 'active']
  ];

  sampleShowtimes.forEach(showtime => {
    insertShowtime.run(...showtime);
  });

  console.log('Dữ liệu mẫu đã được chèn thành công!');
}

// Khởi tạo database khi import module
initializeDatabase();
insertSampleData();

module.exports = db;
