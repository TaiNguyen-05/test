const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import database và models
const db = require('../database');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Category = require('../models/Category');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

// Cấu hình multer để upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    },
    fileFilter: function (req, file, cb) {
        // Chỉ chấp nhận file ảnh
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

// Middleware kiểm tra quyền admin (có thể thêm sau)
const requireAdmin = (req, res, next) => {
  // TODO: Implement JWT authentication
  next();
};

// Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      users: User.getCount(),
      movies: Movie.getCount(),
      categories: Category.getCount(),
      showtimes: Showtime.getCount(),
      bookings: Booking.getCount(),
      activities: Activity.getCount(),
      totalRevenue: Booking.getTotalRevenue(),
      dailyStats: Booking.getDailyStats(7),
      movieStats: Booking.getMovieStats(),
      recentActivities: Activity.getRecent(24)
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
});

// User management
router.get('/users', (req, res) => {
  try {
    const { role, status, search } = req.query;
    let users;
    
    if (search) {
      // Tìm kiếm user theo tên hoặc email
      const searchQuery = `%${search}%`;
      const stmt = db.prepare(`
        SELECT id, name, email, phone, role, status, createdAt 
        FROM users 
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY createdAt DESC
      `);
      users = stmt.all(searchQuery, searchQuery);
    } else if (role) {
      users = User.getByRole(role);
    } else if (status) {
      users = User.getByStatus(status);
    } else {
      users = User.getAll();
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
  }
});

router.post('/users', (req, res) => {
  try {
    // Kiểm tra email đã tồn tại
    if (User.emailExists(req.body.email)) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    const userId = uuidv4();
    User.create({
      id: userId,
      ...req.body,
      status: 'active'
    });
    
    const newUser = User.getById(userId);
    
    Activity.create({
      id: uuidv4(),
      type: 'user_added',
      description: `Người dùng mới "${newUser.name}" đã được thêm vào hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm người dùng' });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const existingUser = User.getById(userId);
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    // Kiểm tra email đã tồn tại (nếu thay đổi email)
    if (req.body.email && req.body.email !== existingUser.email) {
      if (User.emailExists(req.body.email, userId)) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
      }
    }
    
    const success = User.update(userId, req.body);
    if (!success) {
      return res.status(500).json({ error: 'Cập nhật người dùng thất bại' });
    }
    
    const updatedUser = User.getById(userId);
    
    Activity.create({
      id: uuidv4(),
      type: 'user_updated',
      description: `Người dùng "${updatedUser.name}" đã được cập nhật`,
      timestamp: new Date().toISOString()
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật người dùng' });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const existingUser = User.getById(userId);
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    // Không cho phép xóa admin
    if (existingUser.role === 'admin') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin' });
    }
    
    const success = User.delete(userId);
    if (!success) {
      return res.status(500).json({ error: 'Xóa người dùng thất bại' });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'user_deleted',
      description: `Người dùng "${existingUser.name}" đã được xóa khỏi hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Người dùng đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa người dùng' });
  }
});

// Movie management
router.get('/movies', (req, res) => {
  try {
    const { status, search, category } = req.query;
    let movies;
    
    if (search) {
      movies = Movie.search(search);
    } else if (category) {
      movies = Movie.getByCategory(parseInt(category));
    } else if (status) {
      movies = Movie.getByStatus(status);
    } else {
      movies = Movie.getAllForAdmin();
    }
    
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phim' });
  }
});

router.post('/movies', upload.single('moviePoster'), (req, res) => {
  try {
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    
    // Xử lý file upload nếu có
    let posterPath = null;
    if (req.file) {
      posterPath = `/uploads/${req.file.filename}`;
    }
    
    // Map các trường từ form HTML sang database
    const movieData = {
      title: req.body.movieTitle,
      categoryId: req.body.movieCategory,
      duration: req.body.movieDuration,
      rating: req.body.movieRating,
      description: req.body.movieDescription,
      trailer: req.body.movieTrailer,
      subtitles: req.body.movieSubtitles,
      poster: posterPath,
      status: 'active'
    };
    
    console.log('Movie Data:', movieData);
    
    const movieId = Movie.create(movieData);
    
    const newMovie = Movie.getById(movieId);
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_added',
      description: `Phim mới "${newMovie.title}" đã được thêm vào hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newMovie);
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Lỗi khi thêm phim: ' + error.message });
  }
});

router.put('/movies/:id', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const existingMovie = Movie.getById(movieId);
    
    if (!existingMovie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }
    
    const success = Movie.update(movieId, req.body);
    if (!success) {
      return res.status(500).json({ error: 'Cập nhật phim thất bại' });
    }
    
    const updatedMovie = Movie.getById(movieId);
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_updated',
      description: `Phim "${updatedMovie.title}" đã được cập nhật`,
      timestamp: new Date().toISOString()
    });
    
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật phim' });
  }
});

router.delete('/movies/:id', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const existingMovie = Movie.getById(movieId);
    
    if (!existingMovie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }
    
    const success = Movie.delete(movieId);
    if (!success) {
      return res.status(500).json({ error: 'Xóa phim thất bại' });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_deleted',
      description: `Phim "${existingMovie.title}" đã được xóa khỏi hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Phim đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa phim' });
  }
});

// Database management endpoints
router.get('/database/backup', (req, res) => {
  try {
    const backupName = `cinema_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    
    Activity.create({
      id: uuidv4(),
      type: 'database_backup',
      description: 'Database đã được backup',
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Backup thành công',
      filename: backupName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi backup database' });
  }
});

router.post('/database/cleanup', (req, res) => {
  try {
    const deletedActivities = Activity.cleanupOld(100);
    
    Activity.create({
      id: uuidv4(),
      type: 'database_cleanup',
      description: `Database đã được dọn dẹp - xóa ${deletedActivities} hoạt động cũ`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Dọn dẹp database thành công',
      deletedActivities: deletedActivities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi dọn dẹp database' });
  }
});

module.exports = router;
