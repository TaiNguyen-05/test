const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Import uuid for booking ID generation

// Import models
const Movie = require('../models/Movie');
const Category = require('../models/Category');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const User = require('../models/User'); // Added User model import

// Public API endpoints
router.get('/movies', (req, res) => {
  try {
    const { category, search, limit } = req.query;
    let movies;
    
    if (search) {
      movies = Movie.search(search);
    } else if (category) {
      movies = Movie.getByCategory(parseInt(category));
    } else {
      movies = Movie.getAll();
    }
    
    // Giới hạn kết quả nếu có
    if (limit) {
      movies = movies.slice(0, parseInt(limit));
    }
    
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phim' });
  }
});

router.get('/movies/:id', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const movie = Movie.getById(movieId);
    
    if (!movie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin phim' });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = Category.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thể loại' });
  }
});

router.get('/showtimes', (req, res) => {
  try {
    const { movieId, date, dateRange } = req.query;
    let showtimes;
    
    if (movieId) {
      showtimes = Showtime.getByMovieId(parseInt(movieId));
    } else if (date) {
      showtimes = Showtime.getByDate(date);
    } else if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      showtimes = Showtime.getByDateRange(startDate, endDate);
    } else {
      showtimes = Showtime.getAll();
    }
    
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách suất chiếu' });
  }
});

router.get('/showtimes/:id', (req, res) => {
  try {
    const showtimeId = parseInt(req.params.id);
    const showtime = Showtime.getById(showtimeId);
    
    if (!showtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    res.json(showtime);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin suất chiếu' });
  }
});

// Endpoint để kiểm tra ghế còn trống
router.get('/showtimes/:id/seats', (req, res) => {
  try {
    const showtimeId = parseInt(req.params.id);
    const seats = Showtime.getSeats(showtimeId);
    res.json(seats);
  } catch (error) {
    console.error('Error getting seats:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin ghế' });
  }
});

// Endpoint tìm kiếm tổng hợp
router.get('/search', (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Từ khóa tìm kiếm không được để trống' });
    }
    
    const results = {};
    
    if (!type || type === 'movies') {
      results.movies = Movie.search(q);
    }
    
    if (!type || type === 'categories') {
      results.categories = Category.search(q);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tìm kiếm' });
  }
});

// Endpoint thống kê công khai
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalMovies: Movie.getCount(),
      totalCategories: Category.getCount(),
      totalShowtimes: Showtime.getCount(),
      popularMovies: Movie.getAll().slice(0, 5) // Top 5 phim
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thống kê' });
  }
});

// Endpoint đăng ký
router.post('/auth/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin cần thiết để đăng ký' });
    }
    
    // Kiểm tra email đã tồn tại
    if (User.emailExists(email)) {
      return res.status(400).json({ error: 'Email đã được sử dụng!' });
    }
    
    // Tạo user mới
    const userId = uuidv4();
    const newUser = {
      id: userId,
      name: name,
      email: email,
      phone: phone,
      password: password, // Trong thực tế nên hash password
      role: "user",
      status: "active",
      createdAt: new Date().toISOString()
    };
    
    User.create(newUser);
    
    // Trả về user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Đăng ký thành công!',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký' });
  }
});

// Endpoint đăng nhập
router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }
    
    // Tìm user theo email
    const user = User.getByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra password (trong thực tế nên so sánh hash)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra trạng thái user
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Tài khoản đã bị khóa' });
    }
    
    // Trả về user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Đăng nhập thành công!',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Lỗi khi đăng nhập' });
  }
});

// Endpoint để đặt vé
router.post('/bookings', (req, res) => {
  try {
    console.log('Booking request received:', req.body); // Debug log
    
    const { userId, showtimeId, seats, totalPrice, paymentMethod } = req.body;
    
    if (!userId || !showtimeId || !seats || !totalPrice) {
      console.log('Missing required fields:', { userId, showtimeId, seats, totalPrice }); // Debug log
      return res.status(400).json({ error: 'Thiếu thông tin cần thiết để đặt vé' });
    }
    
    // Kiểm tra showtime có tồn tại không
    const showtime = Showtime.getById(parseInt(showtimeId));
    console.log('Showtime found:', showtime); // Debug log
    
    if (!showtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    // Kiểm tra ghế có còn trống không
    const existingBookings = Booking.getByShowtimeId(parseInt(showtimeId));
    console.log('Existing bookings:', existingBookings); // Debug log
    
    const bookedSeats = [];
    existingBookings.forEach(booking => {
      const bookingSeats = JSON.parse(booking.seats);
      bookedSeats.push(...bookingSeats);
    });
    
    const requestedSeats = Array.isArray(seats) ? seats : [seats];
    const isSeatAvailable = requestedSeats.every(seat => !bookedSeats.includes(seat));
    
    console.log('Seat availability check:', { requestedSeats, bookedSeats, isSeatAvailable }); // Debug log
    
    if (!isSeatAvailable) {
      return res.status(400).json({ error: 'Một số ghế đã được đặt trước đó' });
    }
    
    // Lấy thông tin phim
    const movie = Movie.getById(showtime.movieId);
    console.log('Movie found:', movie); // Debug log
    
    // Tạo booking mới
    const bookingId = uuidv4();
    const newBooking = {
      id: bookingId,
      userId: userId,
      showtimeId: parseInt(showtimeId),
      movieTitle: movie.title,
      seats: requestedSeats,
      totalPrice: parseFloat(totalPrice),
      paymentMethod: paymentMethod || 'cash',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating new booking:', newBooking); // Debug log
    
    const result = Booking.create(newBooking);
    console.log('Booking creation result:', result); // Debug log
    
    if (result) {
      // Lấy booking vừa tạo để trả về
      const createdBooking = Booking.getById(bookingId);
      console.log('Created booking:', createdBooking); // Debug log
      
      res.status(201).json({
        message: 'Đặt vé thành công!',
        booking: createdBooking
      });
    } else {
      res.status(500).json({ error: 'Lỗi khi tạo booking' });
    }
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Lỗi khi đặt vé: ' + error.message });
  }
});

// Endpoint để xem vé của người dùng
router.get('/users/:userId/bookings', (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId' });
    }
    
    const userBookings = Booking.getByUserId(userId);
    res.json(userBookings);
    
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách vé' });
  }
});

// Endpoint để hủy vé
router.delete('/bookings/:id', (req, res) => {
  try {
    const bookingId = req.params.id;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Thiếu booking ID' });
    }
    
    // Kiểm tra booking có tồn tại không
    const existingBooking = Booking.getById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Vé không tồn tại' });
    }
    
    // Hủy vé (soft delete hoặc cập nhật status)
    const success = Booking.cancel(bookingId);
    
    if (success) {
      res.json({ message: 'Hủy vé thành công' });
    } else {
      res.status(500).json({ error: 'Lỗi khi hủy vé' });
    }
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Lỗi khi hủy vé' });
  }
});

module.exports = router;
