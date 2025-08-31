const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import database
const db = require('./database-simple');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Category = require('./models/Category');
const Showtime = require('./models/Showtime');
const Booking = require('./models/Booking');
const Activity = require('./models/Activity');

// Import routes
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Khởi tạo database và dữ liệu mẫu
console.log('Đang khởi tạo hệ thống...');

// Tạo admin mặc định nếu chưa có
setTimeout(() => {
  try {
    const defaultAdminEmail = "admin@cinemabooking.com";
    let defaultAdmin = User.getByEmail(defaultAdminEmail);

    if (!defaultAdmin) {
      const adminId = uuidv4();
      User.create({
        id: adminId,
        name: "Admin",
        email: defaultAdminEmail,
        phone: "+84 123 456 789",
        password: "admin123",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString()
      });
      defaultAdmin = User.getById(adminId);
      console.log('Admin mặc định đã được tạo:', defaultAdmin.email);
    }
  } catch (error) {
    console.log('Lỗi khi tạo admin mặc định:', error.message);
  }
}, 1000); // Đợi 1 giây để database khởi tạo xong

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Gửi dữ liệu ban đầu từ database
  const movies = Movie.getAll();
  const showtimes = Showtime.getAll();
  socket.emit('movies', movies);
  socket.emit('showtimes', showtimes);

  // Xử lý đăng ký
  socket.on('register', (userData) => {
    try {
      // Kiểm tra email đã tồn tại
      if (User.emailExists(userData.email)) {
        socket.emit('authError', 'Email đã được sử dụng!');
        return;
      }

      // Tạo user mới
      const newUserId = uuidv4();
      User.create({
        id: newUserId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: "user",
        status: "active",
        createdAt: new Date().toISOString()
      });

      const newUser = User.getById(newUserId);
      console.log(`User registered: ${newUser.name}`);
      
      // Ghi log hoạt động
      Activity.create({
        id: uuidv4(),
        type: 'user_registered',
        description: `Người dùng "${newUser.name}" (${newUser.email}) đã đăng ký tài khoản`,
        userId: newUser.id,
        timestamp: new Date().toISOString()
      });
      
      // Gửi thông tin user (không bao gồm password)
      const { password, ...userInfo } = newUser;
      socket.emit('userRegistered', userInfo);
      
    } catch (error) {
      console.error('Registration error:', error);
      socket.emit('authError', 'Đăng ký thất bại!');
    }
  });

  // Xử lý đăng nhập
  socket.on('login', (loginData) => {
    try {
      // Tìm user theo email
      const user = User.getByEmail(loginData.email);
      
      if (!user) {
        socket.emit('authError', 'Email không tồn tại!');
        return;
      }

      // Kiểm tra password
      if (user.password !== loginData.password) {
        socket.emit('authError', 'Mật khẩu không đúng!');
        return;
      }

      console.log(`User logged in: ${user.name}`);
      
      // Ghi log hoạt động
      Activity.create({
        id: uuidv4(),
        type: 'user_login',
        description: `Người dùng "${user.name}" (${user.email}) đã đăng nhập`,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      // Gửi thông tin user (không bao gồm password)
      const { password, ...userInfo } = user;
      socket.emit('userLoggedIn', userInfo);
      
    } catch (error) {
      console.error('Login error:', error);
      socket.emit('authError', 'Đăng nhập thất bại!');
    }
  });

  // Xử lý đặt vé
  socket.on('bookTicket', (bookingData) => {
    try {
      // Kiểm tra suất chiếu còn ghế không
      const showtime = Showtime.getById(bookingData.showtimeId);
      if (!showtime) {
        socket.emit('bookingError', 'Suất chiếu không tồn tại!');
        return;
      }

      if (showtime.availableSeats < bookingData.seats.length) {
        socket.emit('bookingError', `Không đủ ghế! Chỉ còn ${showtime.availableSeats} ghế trống.`);
        return;
      }

      // Tạo booking mới
      const newBookingId = uuidv4();
      Booking.create({
        id: newBookingId,
        ...bookingData,
        movieTitle: showtime.movieTitle, // Lấy từ showtime
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      const newBooking = Booking.getById(newBookingId);

      // Cập nhật số ghế còn lại
      Showtime.updateAvailableSeats(showtime.id, bookingData.seats.length);

      console.log(`Ticket booked: ${newBooking.id} for showtime ${showtime.id} - ${bookingData.seats.length} ghế`);

      // Ghi log hoạt động
      Activity.create({
        id: uuidv4(),
        type: 'ticket_booked',
        description: `Vé xem phim "${newBooking.movieTitle}" đã được đặt thành công - ${bookingData.seats.length} ghế`,
        userId: newBooking.userId,
        timestamp: new Date().toISOString()
      });

      // Gửi xác nhận booking
      socket.emit('bookingConfirmed', newBooking);

      // Thông báo cho tất cả client về việc cập nhật ghế
      const updatedShowtime = Showtime.getById(showtime.id);
      io.emit('seatsUpdated', {
        showtimeId: showtime.id,
        availableSeats: updatedShowtime.availableSeats
      });

    } catch (error) {
      console.error('Booking error:', error);
      socket.emit('bookingError', 'Đặt vé thất bại!');
    }
  });

  // Xử lý hủy vé
  socket.on('cancelTicket', (bookingId) => {
    try {
      const booking = Booking.getById(bookingId);
      if (!booking) {
        socket.emit('bookingError', 'Vé không tồn tại!');
        return;
      }
      
      // Cập nhật số ghế còn lại
      const showtime = Showtime.getById(booking.showtimeId);
      if (showtime) {
        const seatsArray = JSON.parse(booking.seats);
        Showtime.refundSeats(showtime.id, seatsArray.length);
        
        // Thông báo cho tất cả client về việc cập nhật ghế
        const updatedShowtime = Showtime.getById(showtime.id);
        io.emit('seatsUpdated', {
          showtimeId: showtime.id,
          availableSeats: updatedShowtime.availableSeats
        });
      }

      // Xóa booking
      Booking.delete(bookingId);

      console.log(`Ticket cancelled: ${bookingId} - ${seatsArray.length} ghế`);
      
      // Ghi log hoạt động
      Activity.create({
        id: uuidv4(),
        type: 'ticket_cancelled',
        description: `Vé xem phim "${booking.movieTitle}" đã được hủy - ${seatsArray.length} ghế`,
        userId: booking.userId,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('ticketCancelled', bookingId);

    } catch (error) {
      console.error('Cancellation error:', error);
      socket.emit('bookingError', 'Hủy vé thất bại!');
    }
  });

  // Xử lý đăng nhập admin
  socket.on('adminLogin', (loginData) => {
    try {
      // Tìm user admin theo email
      const adminUser = User.getByEmail(loginData.email);
      
      if (!adminUser || adminUser.role !== 'admin') {
        socket.emit('adminLoginError', 'Email admin không tồn tại hoặc không có quyền admin!');
        return;
      }

      // Kiểm tra password
      if (adminUser.password !== loginData.password) {
        socket.emit('adminLoginError', 'Mật khẩu không đúng!');
        return;
      }

      console.log(`Admin logged in: ${adminUser.name}`);
      
      // Ghi log hoạt động
      Activity.create({
        id: uuidv4(),
        type: 'admin_login',
        description: `Admin "${adminUser.name}" (${adminUser.email}) đã đăng nhập vào hệ thống`,
        userId: adminUser.id,
        timestamp: new Date().toISOString()
      });
      
      // Gửi thông tin admin (không bao gồm password)
      const { password, ...adminInfo } = adminUser;
      socket.emit('adminLoginSuccess', adminInfo);
      
    } catch (error) {
      console.error('Admin login error:', error);
      socket.emit('adminLoginError', 'Đăng nhập admin thất bại!');
    }
  });

  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Database cleanup function
function cleanupDatabase() {
  try {
    // Dọn dẹp activities cũ
    const deletedCount = Activity.cleanupOld(100);
    if (deletedCount > 0) {
      console.log(`Đã dọn dẹp ${deletedCount} hoạt động cũ`);
    }
  } catch (error) {
    console.error('Lỗi khi dọn dẹp database:', error);
  }
}

// Dọn dẹp database mỗi giờ
setInterval(cleanupDatabase, 60 * 60 * 1000);

// API Routes
app.get('/api/movies', (req, res) => {
  try {
    const movies = Movie.getAll();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phim' });
  }
});

app.get('/api/showtimes', (req, res) => {
  try {
    const showtimes = Showtime.getAll();
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách suất chiếu' });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const bookings = Booking.getAll();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đặt vé' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
  }
});

// Admin API Routes
app.get('/api/admin/movies', (req, res) => {
  try {
    const movies = Movie.getAllForAdmin();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phim' });
  }
});

app.get('/api/admin/categories', (req, res) => {
  try {
    const categories = Category.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thể loại' });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const users = User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
  }
});

app.get('/api/admin/showtimes', (req, res) => {
  try {
    const showtimes = Showtime.getAllForAdmin();
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách suất chiếu' });
  }
});

app.get('/api/admin/bookings', (req, res) => {
  try {
    const bookings = Booking.getAll();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đặt vé' });
  }
});

app.get('/api/admin/activities', (req, res) => {
  try {
    const activities = Activity.getAll();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hoạt động' });
  }
});

// Admin CRUD Operations
app.post('/api/admin/movies', (req, res) => {
  try {
    const movieId = Movie.create({
      ...req.body,
      status: 'active'
    });
    
    const newMovie = Movie.getById(movieId);
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_added',
      description: `Phim mới "${newMovie.title}" đã được thêm vào hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm phim' });
  }
});

app.put('/api/admin/movies/:id', (req, res) => {
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

app.delete('/api/admin/movies/:id', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const existingMovie = Movie.getById(movieId);
    
    if (!existingMovie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }
    
    // Kiểm tra xem phim đã bị xóa chưa
    if (existingMovie.status === 'deleted') {
      return res.status(400).json({ error: 'Phim đã bị xóa trước đó' });
    }
    
    const success = Movie.delete(movieId);
    if (!success) {
      return res.status(400).json({ 
        error: 'Không thể xóa phim',
        message: 'Phim này đang có suất chiếu hoạt động. Vui lòng hủy tất cả suất chiếu trước khi xóa.'
      });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_deleted',
      description: `Phim "${existingMovie.title}" đã được xóa khỏi hệ thống`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Phim đã được xóa thành công',
      note: 'Phim đã được ẩn khỏi hệ thống (soft delete)'
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa phim' });
  }
});

// Khôi phục phim đã bị xóa
app.post('/api/admin/movies/:id/restore', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const existingMovie = Movie.getById(movieId);
    
    if (!existingMovie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }
    
    if (existingMovie.status !== 'deleted') {
      return res.status(400).json({ error: 'Phim này chưa bị xóa' });
    }
    
    const success = Movie.restore(movieId);
    if (!success) {
      return res.status(500).json({ error: 'Khôi phục phim thất bại' });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'movie_restored',
      description: `Phim "${existingMovie.title}" đã được khôi phục`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Phim đã được khôi phục thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi khôi phục phim' });
  }
});

app.post('/api/admin/categories', (req, res) => {
  try {
    const categoryId = Category.create(req.body);
    const newCategory = Category.getById(categoryId);
    
    Activity.create({
      id: uuidv4(),
      type: 'category_added',
      description: `Thể loại mới "${newCategory.name}" đã được thêm`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm thể loại' });
  }
});

app.put('/api/admin/categories/:id', (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const existingCategory = Category.getById(categoryId);
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Thể loại không tồn tại' });
    }
    
    const success = Category.update(categoryId, req.body);
    if (!success) {
      return res.status(500).json({ error: 'Cập nhật thể loại thất bại' });
    }
    
    const updatedCategory = Category.getById(categoryId);
    
    Activity.create({
      id: uuidv4(),
      type: 'category_updated',
      description: `Thể loại "${updatedCategory.name}" đã được cập nhật`,
      timestamp: new Date().toISOString()
    });
    
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thể loại' });
  }
});

app.delete('/api/admin/categories/:id', (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const existingCategory = Category.getById(categoryId);
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Thể loại không tồn tại' });
    }
    
    // Kiểm tra xem category có được sử dụng không
    if (Category.isUsed(categoryId)) {
      return res.status(400).json({ error: 'Không thể xóa thể loại đang được sử dụng' });
    }
    
    const success = Category.delete(categoryId);
    if (!success) {
      return res.status(500).json({ error: 'Xóa thể loại thất bại' });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'category_deleted',
      description: `Thể loại "${existingCategory.name}" đã được xóa`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Thể loại đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa thể loại' });
  }
});

app.post('/api/admin/users', (req, res) => {
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

app.put('/api/admin/users/:id', (req, res) => {
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

app.delete('/api/admin/users/:id', (req, res) => {
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

app.post('/api/admin/showtimes', (req, res) => {
  try {
    const showtimeId = Showtime.create({
      ...req.body,
      status: 'active',
      availableSeats: req.body.maxSeats || 80
    });
    
    const newShowtime = Showtime.getById(showtimeId);
    
    Activity.create({
      id: uuidv4(),
      type: 'showtime_added',
      description: `Suất chiếu mới cho phim "${newShowtime.movieTitle}" đã được thêm`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newShowtime);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm suất chiếu' });
  }
});

app.put('/api/admin/showtimes/:id', (req, res) => {
  try {
    const showtimeId = parseInt(req.params.id);
    const existingShowtime = Showtime.getById(showtimeId);
    
    if (!existingShowtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    const success = Showtime.update(showtimeId, req.body);
    if (!success) {
      return res.status(500).json({ error: 'Cập nhật suất chiếu thất bại' });
    }
    
    const updatedShowtime = Showtime.getById(showtimeId);
    
    Activity.create({
      id: uuidv4(),
      type: 'showtime_updated',
      description: `Suất chiếu cho phim "${updatedShowtime.movieTitle}" đã được cập nhật`,
      timestamp: new Date().toISOString()
    });
    
    res.json(updatedShowtime);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật suất chiếu' });
  }
});

app.delete('/api/admin/showtimes/:id', (req, res) => {
  try {
    const showtimeId = parseInt(req.params.id);
    const existingShowtime = Showtime.getById(showtimeId);
    
    if (!existingShowtime) {
      return res.status(404).json({ error: 'Suất chiếu không tồn tại' });
    }
    
    // Kiểm tra xem có booking nào cho showtime này không
    const bookings = Booking.getByShowtimeId(showtimeId);
    if (bookings.length > 0) {
      return res.status(400).json({ error: 'Không thể xóa suất chiếu đã có người đặt vé' });
    }
    
    const success = Showtime.delete(showtimeId);
    if (!success) {
      return res.status(500).json({ error: 'Xóa suất chiếu thất bại' });
    }
    
    Activity.create({
      id: uuidv4(),
      type: 'showtime_deleted',
      description: `Suất chiếu cho phim "${existingShowtime.movieTitle}" đã được xóa`,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Suất chiếu đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa suất chiếu' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      users: User.getCount(),
      bookings: Booking.getCount(),
      movies: Movie.getCount(),
      showtimes: Showtime.getCount(),
      categories: Category.getCount(),
      activities: Activity.getCount()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Có lỗi xảy ra!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Không tìm thấy trang!',
    path: req.path
  });
});



const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`Truy cập: http://localhost:${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`Database: cinema.db`);
  console.log(`Admin mặc định: admin@cinemabooking.com / admin123`);
  
  // Hiển thị thống kê từ database
  try {
    console.log(`Số lượng phim: ${Movie.getCount()}`);
    console.log(`Số lượng suất chiếu: ${Showtime.getCount()}`);
    console.log(`Số lượng thể loại: ${Category.getCount()}`);
    console.log(`Số lượng người dùng: ${User.getCount()}`);
    console.log(`Số lượng đặt vé: ${Booking.getCount()}`);
    console.log(`Số lượng hoạt động: ${Activity.getCount()}`);
  } catch (error) {
    console.log('Lỗi khi lấy thống kê:', error.message);
  }
});
