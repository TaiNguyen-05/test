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
      isDeleted INTEGER DEFAULT 0,
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
      paymentMethod TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'confirmed',
      isDeleted INTEGER DEFAULT 0,
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

// Migration: Thêm cột mới nếu chưa có
function migrateDatabase() {
  console.log('Đang kiểm tra và cập nhật database...');
  
  try {
    // Kiểm tra xem cột paymentMethod đã tồn tại chưa
    const columns = db.pragma('table_info(bookings)');
    const hasPaymentMethod = columns.some(col => col.name === 'paymentMethod');
    
    if (!hasPaymentMethod) {
      console.log('Thêm cột paymentMethod vào bảng bookings...');
      db.exec('ALTER TABLE bookings ADD COLUMN paymentMethod TEXT DEFAULT "cash"');
      console.log('Đã thêm cột paymentMethod thành công!');
    } else {
      console.log('Cột paymentMethod đã tồn tại.');
    }
    
    // Kiểm tra xem cột isDeleted đã tồn tại trong bảng movies chưa
    const movieColumns = db.pragma('table_info(movies)');
    const hasIsDeleted = movieColumns.some(col => col.name === 'isDeleted');
    
    if (!hasIsDeleted) {
      console.log('Thêm cột isDeleted vào bảng movies...');
      db.exec('ALTER TABLE movies ADD COLUMN isDeleted INTEGER DEFAULT 0');
      console.log('Đã thêm cột isDeleted thành công!');
    } else {
      console.log('Cột isDeleted đã tồn tại.');
    }
    
    // Kiểm tra xem cột isDeleted đã tồn tại trong bảng bookings chưa
    const bookingColumns = db.pragma('table_info(bookings)');
    const hasBookingIsDeleted = bookingColumns.some(col => col.name === 'isDeleted');
    
    if (!hasBookingIsDeleted) {
      console.log('Thêm cột isDeleted vào bảng bookings...');
      db.exec('ALTER TABLE bookings ADD COLUMN isDeleted INTEGER DEFAULT 0');
      console.log('Đã thêm cột isDeleted thành công!');
    } else {
      console.log('Cột isDeleted đã tồn tại.');
    }
    
  } catch (error) {
    console.error('Lỗi khi migration database:', error);
  }
}

// Chèn dữ liệu mẫu
function insertSampleData() {
  console.log('Đang chèn dữ liệu mẫu...');
  
  // Kiểm tra xem đã có dữ liệu chưa
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Dữ liệu mẫu cơ bản đã tồn tại, kiểm tra phim mới...');
  } else {
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
  }

  // Kiểm tra và chèn phim mới
  const movieCount = db.prepare('SELECT COUNT(*) as count FROM movies').get();
  if (movieCount.count < 15) {
    console.log('Thêm phim mới...');
    
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
      ],
      [
        'The Batman',
        'Hành động, Tội phạm',
        '176 phút',
        '8.8/10',
        'https://via.placeholder.com/300x450/2c3e50/ffffff?text=The+Batman',
        'Batman điều tra một loạt các vụ giết người bí ẩn tại Gotham City.',
        'https://www.youtube.com/watch?v=mqqft2x_Aa4',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-04').toISOString()
      ],
      [
        'Doctor Strange in the Multiverse of Madness',
        'Viễn tưởng, Siêu anh hùng',
        '126 phút',
        '8.2/10',
        'https://via.placeholder.com/300x450/9b59b6/ffffff?text=Doctor+Strange',
        'Doctor Strange khám phá đa vũ trụ và đối mặt với những mối đe dọa mới.',
        'https://www.youtube.com/watch?v=aWzlQ2N6qqg',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-05').toISOString()
      ],
      [
        'Top Gun: Maverick',
        'Hành động, Phiêu lưu',
        '130 phút',
        '9.1/10',
        'https://via.placeholder.com/300x450/e74c3c/ffffff?text=Top+Gun',
        'Maverick trở lại để huấn luyện thế hệ phi công mới cho nhiệm vụ nguy hiểm.',
        'https://www.youtube.com/watch?v=giXco2jaZ_4',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-06').toISOString()
      ],
      [
        'Jurassic World: Dominion',
        'Viễn tưởng, Phiêu lưu',
        '146 phút',
        '7.8/10',
        'https://via.placeholder.com/300x450/27ae60/ffffff?text=Jurassic+World',
        'Con người và khủng long phải học cách chung sống trong thế giới mới.',
        'https://www.youtube.com/watch?v=fb5ELWi-ekk',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-07').toISOString()
      ],
      [
        'The Conjuring: The Devil Made Me Do It',
        'Kinh dị, Tội phạm',
        '112 phút',
        '7.5/10',
        'https://via.placeholder.com/300x450/8e44ad/ffffff?text=Conjuring',
        'Cặp vợ chồng Warren điều tra vụ án giết người đầu tiên được bảo vệ bởi lý do ma quỷ.',
        'https://www.youtube.com/watch?v=h9Q4zV2d3Do',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-08').toISOString()
      ],
      [
        'Free Guy',
        'Hành động, Hài',
        '115 phút',
        '8.1/10',
        'https://via.placeholder.com/300x450/f39c12/ffffff?text=Free+Guy',
        'Một nhân vật trong game video nhận ra mình là AI và cố gắng trở thành anh hùng thực sự.',
        'https://www.youtube.com/watch?v=X2m-08cOAbc',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-09').toISOString()
      ],
      [
        'Dune',
        'Viễn tưởng, Phiêu lưu',
        '155 phút',
        '8.8/10',
        'https://via.placeholder.com/300x450/34495e/ffffff?text=Dune',
        'Paul Atreides dẫn dắt cuộc nổi dậy để khôi phục vương quốc của gia đình trên hành tinh Arrakis.',
        'https://www.youtube.com/watch?v=n9xhJrPXop4',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-10').toISOString()
      ],
      [
        'Shang-Chi and the Legend of the Ten Rings',
        'Hành động, Siêu anh hùng',
        '132 phút',
        '8.4/10',
        'https://via.placeholder.com/300x450/e67e22/ffffff?text=Shang-Chi',
        'Shang-Chi phải đối mặt với quá khứ của mình khi bị lôi kéo vào tổ chức Ten Rings.',
        'https://www.youtube.com/watch?v=giXco2jaZ_4',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-11').toISOString()
      ],
      [
        'No Time to Die',
        'Hành động, Tội phạm',
        '163 phút',
        '8.7/10',
        'https://via.placeholder.com/300x450/16a085/ffffff?text=James+Bond',
        'James Bond đối mặt với nhiệm vụ nguy hiểm nhất trong sự nghiệp điệp viên.',
        'https://www.youtube.com/watch?v=BIhNsAtPbPI',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-12').toISOString()
      ],
      [
        'The Suicide Squad',
        'Hành động, Hài',
        '132 phút',
        '8.0/10',
        'https://via.placeholder.com/300x450/c0392b/ffffff?text=Suicide+Squad',
        'Nhóm siêu ác nhân được giao nhiệm vụ nguy hiểm để chuộc tội.',
        'https://www.youtube.com/watch?v=eg5gqXw7wQY',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-13').toISOString()
      ],
      [
        'A Quiet Place Part II',
        'Kinh dị, Viễn tưởng',
        '97 phút',
        '8.2/10',
        'https://via.placeholder.com/300x450/7f8c8d/ffffff?text=Quiet+Place',
        'Gia đình Abbott phải đối mặt với những mối đe dọa mới trong thế giới im lặng.',
        'https://www.youtube.com/watch?v=BpdDN9d9JbQ',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-14').toISOString()
      ],
      [
        'Cruella',
        'Hài, Tội phạm',
        '134 phút',
        '7.8/10',
        'https://via.placeholder.com/300x450/95a5a6/ffffff?text=Cruella',
        'Câu chuyện về sự trỗi dậy của Cruella de Vil trong thế giới thời trang London.',
        'https://www.youtube.com/watch?v=gmRKv7n2If8',
        'Tiếng Việt, English',
        'active',
        new Date('2024-01-15').toISOString()
      ]
    ];

    sampleMovies.forEach(movie => {
      insertMovie.run(...movie);
    });

    // Chèn showtimes
    const insertShowtime = db.prepare(`
      INSERT INTO showtimes (movieId, time, date, price, availableSeats, maxSeats, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleShowtimes = [
      [1, '14:00', '2024-01-15', 120000, 80, 80, 'active'],
      [1, '17:00', '2024-01-15', 120000, 75, 80, 'active'],
      [2, '19:30', '2024-01-15', 110000, 60, 80, 'active'],
      [3, '20:00', '2024-01-15', 130000, 80, 80, 'active'],
      [4, '15:30', '2024-01-15', 125000, 70, 80, 'active'],
      [4, '21:00', '2024-01-15', 125000, 80, 80, 'active'],
      [5, '16:00', '2024-01-15', 115000, 65, 80, 'active'],
      [5, '22:30', '2024-01-15', 115000, 80, 80, 'active'],
      [6, '13:00', '2024-01-15', 130000, 80, 80, 'active'],
      [6, '18:30', '2024-01-15', 130000, 75, 80, 'active'],
      [7, '14:30', '2024-01-15', 120000, 70, 80, 'active'],
      [7, '20:30', '2024-01-15', 120000, 80, 80, 'active'],
      [8, '22:00', '2024-01-15', 110000, 60, 80, 'active'],
      [9, '15:00', '2024-01-15', 105000, 80, 80, 'active'],
      [9, '19:00', '2024-01-15', 105000, 75, 80, 'active'],
      [10, '16:30', '2024-01-15', 135000, 70, 80, 'active'],
      [10, '21:30', '2024-01-15', 135000, 80, 80, 'active'],
      [11, '17:30', '2024-01-15', 125000, 75, 80, 'active'],
      [11, '23:00', '2024-01-15', 125000, 80, 80, 'active'],
      [12, '18:00', '2024-01-15', 140000, 80, 80, 'active'],
      [12, '22:00', '2024-01-15', 140000, 80, 80, 'active'],
      [13, '14:00', '2024-01-15', 110000, 70, 80, 'active'],
      [13, '20:00', '2024-01-15', 110000, 80, 80, 'active'],
      [14, '21:00', '2024-01-15', 115000, 65, 80, 'active'],
      [15, '16:00', '2024-01-15', 100000, 80, 80, 'active'],
      [15, '19:30', '2024-01-15', 100000, 75, 80, 'active']
    ];

    sampleShowtimes.forEach(showtime => {
      insertShowtime.run(...showtime);
    });

    console.log('Phim mới đã được thêm thành công!');
  } else {
    console.log('Đã có đủ phim, bỏ qua...');
  }
}

// Khởi tạo database khi import module
initializeDatabase();

// Chạy migration trước khi insert dữ liệu mẫu
migrateDatabase();
insertSampleData();

module.exports = db;
