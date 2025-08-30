const express = require('express');
const router = express.Router();

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

module.exports = router;
