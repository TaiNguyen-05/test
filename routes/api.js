const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Import uuid for booking ID generation

// Import models
const Movie = require('../models/Movie');
const Category = require('../models/Category');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');

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
    const showtime = Showtime.getById(showtimeId);
    
    if (!showtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    // Lấy danh sách ghế đã đặt
    const bookings = Booking.getByShowtimeId(showtimeId);
    const bookedSeats = [];
    
    bookings.forEach(booking => {
      const seats = JSON.parse(booking.seats);
      bookedSeats.push(...seats);
    });
    
    res.json({
      showtimeId: showtime.id,
      movieTitle: showtime.movieTitle,
      totalSeats: showtime.maxSeats,
      availableSeats: showtime.availableSeats,
      bookedSeats: bookedSeats,
      price: showtime.price
    });
  } catch (error) {
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

// Endpoint để đặt vé
router.post('/bookings', (req, res) => {
  try {
    const { userId, showtimeId, seats, totalPrice } = req.body;
    
    if (!userId || !showtimeId || !seats || !totalPrice) {
      return res.status(400).json({ error: 'Thiếu thông tin cần thiết để đặt vé' });
    }
    
    // Kiểm tra showtime có tồn tại không
    const showtime = Showtime.getById(parseInt(showtimeId));
    if (!showtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    // Kiểm tra ghế có còn trống không
    const existingBookings = Booking.getByShowtimeId(parseInt(showtimeId));
    const bookedSeats = [];
    existingBookings.forEach(booking => {
      const bookingSeats = JSON.parse(booking.seats);
      bookedSeats.push(...bookingSeats);
    });
    
    const requestedSeats = Array.isArray(seats) ? seats : [seats];
    const isSeatAvailable = requestedSeats.every(seat => !bookedSeats.includes(seat));
    
    if (!isSeatAvailable) {
      return res.status(400).json({ error: 'Một số ghế đã được đặt trước đó' });
    }
    
    // Lấy thông tin phim
    const movie = Movie.getById(showtime.movieId);
    
    // Tạo booking mới
    const bookingId = uuidv4();
    const newBooking = {
      id: bookingId,
      userId: userId,
      showtimeId: parseInt(showtimeId),
      movieTitle: movie.title,
      seats: requestedSeats,
      totalPrice: parseFloat(totalPrice),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    const result = Booking.create(newBooking);
    
    if (result) {
      // Lấy booking vừa tạo để trả về
      const createdBooking = Booking.getById(bookingId);
      res.status(201).json({
        message: 'Đặt vé thành công!',
        booking: createdBooking
      });
    } else {
      res.status(500).json({ error: 'Lỗi khi tạo booking' });
    }
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Lỗi khi đặt vé' });
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
