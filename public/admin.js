// Admin Dashboard JavaScript
let currentAdmin = null;
let movies = [];
let categories = [];
let users = [];
let showtimes = [];
let bookings = [];
let activities = [];

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const adminName = document.getElementById('adminName');

// Charts
let popularMoviesChart = null;
let revenueChart = null;
let movieStatsChart = null;
let userStatsChart = null;
let revenueStatsChart = null;

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
    setupCharts();
});

// Initialize Admin
function initializeAdmin() {
    // Check if admin is logged in
    const adminData = localStorage.getItem('adminData');
    if (!adminData) {
        // Redirect to login if not authenticated
        window.location.href = '/admin-login.html';
        return;
    }
    
    currentAdmin = JSON.parse(adminData);
    adminName.textContent = currentAdmin.name;
    
    // Set default dates for statistics
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// Setup Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Show corresponding section
            const targetSection = item.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('active');
            
            // Update page title
            pageTitle.textContent = item.querySelector('span').textContent;
            
            // Load section data
            loadSectionData(targetSection);
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Search and filter events
    document.getElementById('movieSearch')?.addEventListener('input', filterMovies);
    document.getElementById('categoryFilter')?.addEventListener('change', filterMovies);
    document.getElementById('statusFilter')?.addEventListener('change', filterMovies);
    
    document.getElementById('userSearch')?.addEventListener('input', filterUsers);
    document.getElementById('roleFilter')?.addEventListener('change', filterUsers);
    
    document.getElementById('bookingSearch')?.addEventListener('input', filterBookings);
    document.getElementById('bookingStatusFilter')?.addEventListener('change', filterBookings);
    document.getElementById('dateFilter')?.addEventListener('change', filterBookings);
    
    // Form submissions
    document.getElementById('movieForm')?.addEventListener('submit', handleMovieSubmit);
    document.getElementById('categoryForm')?.addEventListener('submit', handleCategorySubmit);
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);
    document.getElementById('showtimeForm')?.addEventListener('submit', handleShowtimeSubmit);
    document.getElementById('generalSettingsForm')?.addEventListener('submit', handleGeneralSettings);
    document.getElementById('securitySettingsForm')?.addEventListener('submit', handleSecuritySettings);
    
    // File upload preview
    document.getElementById('moviePoster')?.addEventListener('change', handlePosterPreview);
    
    // Close notification
    document.getElementById('closeNotification')?.addEventListener('click', hideNotification);
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load all data
        await Promise.all([
            loadMovies(),
            loadCategories(),
            loadUsers(),
            loadShowtimes(),
            loadBookings(),
            loadActivities()
        ]);
        
        // Update dashboard stats
        updateDashboardStats();
        
        // Render initial data
        renderMoviesTable();
        renderCategoriesGrid();
        renderUsersTable();
        renderShowtimesTable();
        renderBookingsTable();
        renderActivityList();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Lỗi khi tải dữ liệu dashboard', 'error');
    }
}

// Load Section Data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'movies':
            renderMoviesTable();
            break;
        case 'categories':
            renderCategoriesGrid();
            break;
        case 'users':
            renderUsersTable();
            break;
        case 'showtimes':
            renderShowtimesTable();
            break;
        case 'bookings':
            renderBookingsTable();
            break;
        case 'statistics':
            updateStatistics();
            break;
    }
}

// Data Loading Functions
async function loadMovies() {
    try {
        const response = await fetch('/api/admin/movies');
        if (response.ok) {
            movies = await response.json();
        }
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/admin/categories');
        if (response.ok) {
            categories = await response.json();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
            users = await response.json();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadShowtimes() {
    try {
        const response = await fetch('/api/admin/showtimes');
        if (response.ok) {
            showtimes = await response.json();
        }
    } catch (error) {
        console.error('Error loading showtimes:', error);
    }
}

async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings');
        if (response.ok) {
            bookings = await response.json();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadActivities() {
    try {
        const response = await fetch('/api/admin/activities');
        if (response.ok) {
            activities = await response.json();
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        // Generate sample activities if API fails
        activities = generateSampleActivities();
    }
}

// Generate Sample Activities
function generateSampleActivities() {
    return [
        {
            id: 1,
            type: 'movie_added',
            title: 'Phim mới được thêm',
            description: 'Avengers: Endgame đã được thêm vào hệ thống',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            icon: 'fas fa-film'
        },
        {
            id: 2,
            type: 'user_registered',
            title: 'Người dùng mới đăng ký',
            description: 'Nguyễn Văn A đã đăng ký tài khoản',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            icon: 'fas fa-user-plus'
        },
        {
            id: 3,
            type: 'booking_confirmed',
            title: 'Đặt vé được xác nhận',
            description: 'Vé xem phim Spider-Man đã được xác nhận',
            timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
            icon: 'fas fa-ticket-alt'
        }
    ];
}

// Update Dashboard Stats
function updateDashboardStats() {
    const today = new Date();
    const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.toDateString() === today.toDateString();
    });
    
    const todayRevenue = todayBookings.reduce((total, booking) => total + booking.totalPrice, 0);
    
    document.getElementById('totalMovies').textContent = movies.length;
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalBookings').textContent = todayBookings.length;
    document.getElementById('totalRevenue').textContent = formatPrice(todayRevenue);
}

// Setup Charts
function setupCharts() {
    setupPopularMoviesChart();
    setupRevenueChart();
    setupMovieStatsChart();
    setupUserStatsChart();
    setupRevenueStatsChart();
}

function setupPopularMoviesChart() {
    const ctx = document.getElementById('popularMoviesChart');
    if (!ctx) return;
    
    const movieData = movies.slice(0, 5).map(movie => ({
        name: movie.title,
        views: Math.floor(Math.random() * 1000) + 100
    }));
    
    popularMoviesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: movieData.map(m => m.name),
            datasets: [{
                data: movieData.map(m => m.views),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#00f2fe'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function setupRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const revenueData = months.map(() => Math.floor(Math.random() * 10000000) + 5000000);
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenueData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatPrice(value);
                        }
                    }
                }
            }
        }
    });
}

// Setup Movie Stats Chart
function setupMovieStatsChart() {
    const ctx = document.getElementById('movieStatsChart');
    if (!ctx) return;
    
    movieStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đang chiếu', 'Sắp chiếu', 'Đã chiếu'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4CAF50', '#FF9800', '#9E9E9E'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Setup User Stats Chart
function setupUserStatsChart() {
    const ctx = document.getElementById('userStatsChart');
    if (!ctx) return;
    
    userStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['User', 'Moderator', 'Admin'],
            datasets: [{
                label: 'Số lượng',
                data: [0, 0, 0],
                backgroundColor: ['#2196F3', '#FF9800', '#F44336'],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Setup Revenue Stats Chart
function setupRevenueStatsChart() {
    const ctx = document.getElementById('revenueStatsChart');
    if (!ctx) return;
    
    revenueStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Render Functions
function renderMoviesTable() {
    const tbody = document.getElementById('moviesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = movies.map(movie => `
        <tr>
            <td>
                ${movie.poster || movie.image ? 
                    `<img src="${movie.poster || movie.image}" alt="${movie.title}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 8px;">` :
                    `<div style="width: 60px; height: 80px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                        <i class="fas fa-image"></i>
                    </div>`
                }
            </td>
            <td>
                <strong>${movie.title}</strong>
                <br><small>${movie.description || 'Không có mô tả'}</small>
            </td>
            <td>
                <span class="status-badge active">${movie.genre || movie.categories || 'Không có thể loại'}</span>
            </td>
            <td>${movie.duration}</td>
            <td>${movie.rating}</td>
            <td>
                ${movie.status === 'deleted' ? 
                    `<span class="status-badge deleted">Đã xóa</span>` :
                    `<span class="status-badge active">Đang chiếu</span>`
                }
            </td>
            <td>
                ${movie.status === 'deleted' ? 
                    `<button class="btn-restore" onclick="restoreMovie(${movie.id})" title="Khôi phục phim">
                        <i class="fas fa-undo"></i>
                    </button>` :
                    `<button class="btn-edit" onclick="editMovie(${movie.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                }
                ${movie.status !== 'deleted' ? 
                    `<button class="btn-delete" onclick="deleteMovie(${movie.id})">
                        <i class="fas fa-trash"></i>
                    </button>` : ''
                }
            </td>
        </tr>
    `).join('');
}

function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(category => `
        <div class="category-card">
            <div class="category-header">
                <span class="category-name">${category.name}</span>
                <div class="category-color" style="background-color: ${category.color}"></div>
            </div>
            <p class="category-description">${category.description || 'Không có mô tả'}</p>
            <div class="category-actions">
                <button class="btn-edit" onclick="editCategory(${category.id})">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn-delete" onclick="deleteCategory(${category.id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        </div>
    `).join('');
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="width: 40px; height: 40px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
            </td>
            <td>
                <strong>${user.name}</strong>
                <br><small>${user.email}</small>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="role-badge ${user.role}">${user.role}</span>
            </td>
            <td>
                <span class="status-badge active">Hoạt động</span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-edit" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderShowtimesTable() {
    const tbody = document.getElementById('showtimesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = showtimes.map(showtime => {
        const movie = movies.find(m => m.id === showtime.movieId);
        return `
            <tr>
                <td>${movie ? movie.title : 'Không xác định'}</td>
                <td>${showtime.time}</td>
                <td>${formatDate(showtime.date)}</td>
                <td>${formatPrice(showtime.price)}</td>
                <td>${showtime.availableSeats}</td>
                <td>
                    <span class="status-badge active">Hoạt động</span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editShowtime(${showtime.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteShowtime(${showtime.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = bookings.map(booking => {
        // Parse seats từ JSON string
        let seatsArray = [];
        try {
            seatsArray = JSON.parse(booking.seats);
        } catch (e) {
            seatsArray = [booking.seats];
        }
        
        // Xác định status badge
        let statusBadge = '';
        let statusClass = '';
        switch(booking.status) {
            case 'confirmed':
                statusBadge = 'Đã xác nhận';
                statusClass = 'confirmed';
                break;
            case 'cancelled':
                statusBadge = 'Đã hủy';
                statusClass = 'cancelled';
                break;
            case 'pending':
                statusBadge = 'Chờ xác nhận';
                statusClass = 'pending';
                break;
            default:
                statusBadge = booking.status;
                statusClass = 'default';
        }
        
        return `
            <tr>
                <td><code>#${booking.id.slice(0, 8)}</code></td>
                <td>${booking.userName}</td>
                <td>${booking.movieTitle}</td>
                <td>${booking.showtime} - ${formatDate(booking.showtimeDate)}</td>
                <td>${seatsArray.join(', ')}</td>
                <td>${formatPrice(booking.totalPrice)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusBadge}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="viewBooking('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-delete" onclick="cancelBooking('${booking.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderActivityList() {
    const list = document.getElementById('activityList');
    if (!list) return;
    
    list.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">
                ${formatTimeAgo(activity.timestamp)}
            </div>
        </div>
    `).join('');
}

// Filter Functions
function filterMovies() {
    const searchTerm = document.getElementById('movieSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredMovies = movies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || movie.genre.includes(categoryFilter);
        const matchesStatus = !statusFilter || movie.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderFilteredMovies(filteredMovies);
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                            user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    renderFilteredUsers(filteredUsers);
}

function filterBookings() {
    const searchTerm = document.getElementById('bookingSearch').value.toLowerCase();
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = booking.userName.toLowerCase().includes(searchTerm) || 
                            booking.movieTitle.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || booking.status === statusFilter;
        const matchesDate = !dateFilter || booking.showtimeDate === dateFilter;
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderFilteredBookings(filteredBookings);
}

// Render Filtered Data
function renderFilteredMovies(filteredMovies) {
    const tbody = document.getElementById('moviesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredMovies.map(movie => `
        <tr>
            <td>
                ${movie.poster || movie.image ? 
                    `<img src="${movie.poster || movie.image}" alt="${movie.title}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 8px;">` :
                    `<div style="width: 60px; height: 80px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                        <i class="fas fa-image"></i>
                    </div>`
                }
            </td>
            <td>
                <strong>${movie.title}</strong>
                <br><small>${movie.description || 'Không có mô tả'}</small>
            </td>
            <td>
                <span class="status-badge active">${movie.genre || movie.categories || 'Không có thể loại'}</span>
            </td>
            <td>${movie.duration}</td>
            <td>${movie.rating}</td>
            <td>
                <span class="status-badge active">Đang chiếu</span>
            </td>
            <td>
                <button class="btn-edit" onclick="editMovie(${movie.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteMovie(${movie.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderFilteredUsers(filteredUsers) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div style="width: 40px; height: 40px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
            </td>
            <td>
                <strong>${user.name}</strong>
                <br><small>${user.email}</small>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="role-badge ${user.role}">${user.role}</span>
            </td>
            <td>
                <span class="status-badge active">Hoạt động</span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-edit" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderFilteredBookings(filteredBookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredBookings.map(booking => `
        <tr>
            <td><code>#${booking.id.slice(0, 8)}</code></td>
            <td>${booking.userName}</td>
            <td>${booking.movieTitle}</td>
            <td>${booking.showtime} - ${formatDate(booking.date)}</td>
            <td>${booking.seats.join(', ')}</td>
            <td>${formatPrice(booking.totalPrice)}</td>
            <td>
                <span class="status-badge confirmed">Đã xác nhận</span>
            </td>
            <td>
                <button class="btn-edit" onclick="viewBooking(${booking.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-delete" onclick="cancelBooking(${booking.id})">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal Functions
function showAddMovieModal() {
    document.getElementById('movieModalTitle').textContent = 'Thêm Phim Mới';
    document.getElementById('movieForm').reset();
    document.getElementById('movieModal').classList.add('show');
    loadCategoriesForSelect();
}

function showAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'Thêm Thể loại';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').classList.add('show');
}

function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Thêm Người dùng';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('show');
}

function showAddShowtimeModal() {
    document.getElementById('showtimeModalTitle').textContent = 'Thêm Suất chiếu';
    document.getElementById('showtimeForm').reset();
    document.getElementById('showtimeModal').classList.add('show');
    loadMoviesForSelect();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// File Upload Preview
function handlePosterPreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('posterPreview');
    
    if (!file) {
        preview.innerHTML = '';
        return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
        showNotification('Vui lòng chọn file ảnh!', 'error');
        e.target.value = '';
        preview.innerHTML = '';
        return;
    }
    
    // Kiểm tra kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.', 'error');
        e.target.value = '';
        preview.innerHTML = '';
        return;
    }
    
    // Tạo preview
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 10px;">
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
                ${file.name} (${(file.size / 1024).toFixed(1)} KB)
            </p>
        `;
    };
    reader.readAsDataURL(file);
}

// Load Data for Selects
function loadCategoriesForSelect() {
    const select = document.getElementById('movieCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">Chọn thể loại</option>' +
        categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
}

function loadMoviesForSelect() {
    const select = document.getElementById('showtimeMovie');
    if (!select) return;
    
    select.innerHTML = '<option value="">Chọn phim</option>' +
        movies.map(movie => 
            `<option value="${movie.id}">${movie.title}</option>`
        ).join('');
}

// Form Handlers
async function handleMovieSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Lấy file ảnh bìa
    const posterFile = formData.get('moviePoster');
    
    // Kiểm tra file
    if (posterFile && posterFile.size > 0) {
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (posterFile.size > 5 * 1024 * 1024) {
            showNotification('Ảnh bìa quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.', 'error');
            return;
        }
        
        // Kiểm tra định dạng file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(posterFile.type)) {
            showNotification('Chỉ chấp nhận file ảnh: JPG, PNG, GIF', 'error');
            return;
        }
    }
    
    try {
        // Gọi API thực tế để tạo movie với file upload
        const response = await fetch('/api/admin/movies', {
            method: 'POST',
            body: formData // Gửi FormData thay vì JSON để hỗ trợ file
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi tạo phim');
        }
        
        const newMovie = await response.json();
        
        showNotification('Phim đã được thêm thành công! 🎬', 'success');
        closeModal('movieModal');
        
        // Reset form và preview
        e.target.reset();
        document.getElementById('posterPreview').innerHTML = '';
        
        // Reload movies
        await loadMovies();
        renderMoviesTable();
        updateDashboardStats();
        
    } catch (error) {
        showNotification(`Lỗi khi thêm phim: ${error.message}`, 'error');
        console.error('Error creating movie:', error);
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const categoryData = {
        name: formData.get('categoryName'),
        description: formData.get('categoryDescription'),
        color: formData.get('categoryColor')
    };
    
    try {
        // Gọi API thực tế để tạo category
        const response = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi tạo thể loại');
        }
        
        const newCategory = await response.json();
        
        showNotification('Thể loại đã được thêm thành công! 🏷️', 'success');
        closeModal('categoryModal');
        
        // Reset form
        e.target.reset();
        
        // Reload categories
        await loadCategories();
        renderCategoriesGrid();
        
    } catch (error) {
        showNotification(`Lỗi khi thêm thể loại: ${error.message}`, 'error');
        console.error('Error creating category:', error);
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        name: formData.get('userName'),
        email: formData.get('userEmail'),
        phone: formData.get('userPhone'),
        role: formData.get('userRole'),
        password: formData.get('userPassword')
    };
    
    try {
        // Gọi API thực tế để tạo user
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi tạo người dùng');
        }
        
        const newUser = await response.json();
        
        showNotification('Người dùng đã được thêm thành công! 👤', 'success');
        closeModal('userModal');
        
        // Reset form
        e.target.reset();
        
        // Reload users
        await loadUsers();
        renderUsersTable();
        updateDashboardStats();
        
    } catch (error) {
        showNotification(`Lỗi khi thêm người dùng: ${error.message}`, 'error');
        console.error('Error creating user:', error);
    }
}

async function handleShowtimeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const showtimeData = {
        movieId: formData.get('showtimeMovie'),
        time: formData.get('showtimeTime'),
        date: formData.get('showtimeDate'),
        price: formData.get('showtimePrice'),
        maxSeats: formData.get('showtimeMaxSeats')
    };
    
    try {
        // Gọi API thực tế để tạo showtime
        const response = await fetch('/api/admin/showtimes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(showtimeData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi tạo suất chiếu');
        }
        
        const newShowtime = await response.json();
        
        showNotification('Suất chiếu đã được thêm thành công! ⏰', 'success');
        closeModal('showtimeModal');
        
        // Reset form
        e.target.reset();
        
        // Reload showtimes
        await loadShowtimes();
        renderShowtimesTable();
        
    } catch (error) {
        showNotification(`Lỗi khi thêm suất chiếu: ${error.message}`, 'error');
        console.error('Error creating showtime:', error);
    }
}

async function handleGeneralSettings(e) {
    e.preventDefault();
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotification('Cài đặt chung đã được lưu thành công! ⚙️', 'success');
        
    } catch (error) {
        showNotification('Lỗi khi lưu cài đặt', 'error');
    }
}

async function handleSecuritySettings(e) {
    e.preventDefault();
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotification('Cài đặt bảo mật đã được lưu thành công! 🔒', 'success');
        
    } catch (error) {
        showNotification('Lỗi khi lưu cài đặt bảo mật', 'error');
    }
}

// CRUD Operations
function editMovie(movieId) {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;
    
    document.getElementById('movieModalTitle').textContent = 'Sửa Phim';
    document.getElementById('movieTitle').value = movie.title;
    document.getElementById('movieCategory').value = movie.categoryId || '';
    document.getElementById('movieDuration').value = movie.duration;
    document.getElementById('movieRating').value = movie.rating;
    document.getElementById('movieDescription').value = movie.description || '';
    document.getElementById('movieTrailer').value = movie.trailer || '';
    document.getElementById('movieSubtitles').value = movie.subtitles || '';
    
    document.getElementById('movieModal').classList.add('show');
    loadCategoriesForSelect();
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    document.getElementById('categoryModalTitle').textContent = 'Sửa Thể loại';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryColor').value = category.color;
    
    document.getElementById('categoryModal').classList.add('show');
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Sửa Người dùng';
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role;
    
    document.getElementById('userModal').classList.add('show');
}

function editShowtime(showtimeId) {
    const showtime = showtimes.find(s => s.id === showtimeId);
    if (!showtime) return;
    
    document.getElementById('showtimeModalTitle').textContent = 'Sửa Suất chiếu';
    document.getElementById('showtimeMovie').value = showtime.movieId;
    document.getElementById('showtimeTime').value = showtime.time;
    document.getElementById('showtimeDate').value = showtime.date;
    document.getElementById('showtimePrice').value = showtime.price;
    document.getElementById('showtimeMaxSeats').value = showtime.maxSeats || 80;
    
    document.getElementById('showtimeModal').classList.add('show');
    loadMoviesForSelect();
}

// Delete Functions
function deleteMovie(movieId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn xóa phim này?',
        () => performDeleteMovie(movieId)
    );
}

function restoreMovie(movieId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn khôi phục phim này?',
        () => performRestoreMovie(movieId)
    );
}

function deleteCategory(categoryId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn xóa thể loại này?',
        () => performDeleteCategory(categoryId)
    );
}

function deleteUser(userId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn xóa người dùng này?',
        () => performDeleteUser(userId)
    );
}

function deleteShowtime(showtimeId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn xóa suất chiếu này?',
        () => performDeleteShowtime(showtimeId)
    );
}

// Perform Delete Operations
async function performDeleteMovie(movieId) {
    try {
        const response = await fetch(`/api/admin/movies/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Cập nhật danh sách phim
            await loadMovies();
            renderMoviesTable();
            updateDashboardStats();
            
            showNotification(result.message + ' ' + (result.note || ''), 'success');
            closeModal('confirmModal');
        } else {
            showNotification(result.error + ': ' + (result.message || ''), 'error');
        }
        
    } catch (error) {
        console.error('Error deleting movie:', error);
        showNotification('Lỗi khi xóa phim: ' + error.message, 'error');
    }
}

async function performRestoreMovie(movieId) {
    try {
        const response = await fetch(`/api/admin/movies/${movieId}/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Cập nhật danh sách phim
            await loadMovies();
            renderMoviesTable();
            updateDashboardStats();
            
            showNotification(result.message, 'success');
            closeModal('confirmModal');
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error restoring movie:', error);
        showNotification('Lỗi khi khôi phục phim: ' + error.message, 'error');
    }
}

async function performDeleteCategory(categoryId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        categories = categories.filter(c => c.id !== categoryId);
        renderCategoriesGrid();
        
        showNotification('Thể loại đã được xóa thành công! 🗑️', 'success');
        closeModal('confirmModal');
        
    } catch (error) {
        showNotification('Lỗi khi xóa thể loại', 'error');
    }
}

async function performDeleteUser(userId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        users = users.filter(u => u.id !== userId);
        renderUsersTable();
        updateDashboardStats();
        
        showNotification('Người dùng đã được xóa thành công! 🗑️', 'success');
        closeModal('confirmModal');
        
    } catch (error) {
        showNotification('Lỗi khi xóa người dùng', 'error');
    }
}

async function performDeleteShowtime(showtimeId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showtimes = showtimes.filter(s => s.id !== showtimeId);
        renderShowtimesTable();
        
        showNotification('Suất chiếu đã được xóa thành công! 🗑️', 'success');
        closeModal('confirmModal');
        
    } catch (error) {
        showNotification('Lỗi khi xóa suất chiếu', 'error');
    }
}

// Confirmation Modal
function showConfirmModal(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmAction').onclick = onConfirm;
    document.getElementById('confirmModal').classList.add('show');
}

// Statistics Functions
function updateStatistics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showNotification('Vui lòng chọn khoảng thời gian', 'error');
        return;
    }
    
    // Update charts with new date range
    updateMovieStatsChart(startDate, endDate);
    updateUserStatsChart(startDate, endDate);
    updateRevenueStatsChart(startDate, endDate);
    updateTopMoviesList(startDate, endDate);
    
    showNotification('Thống kê đã được cập nhật! 📊', 'success');
}

function updateMovieStatsChart(startDate, endDate) {
    const ctx = document.getElementById('movieStatsChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (movieStatsChart) {
        movieStatsChart.destroy();
    }
    
    // Create new chart with filtered data
    const filteredMovies = movies.filter(movie => {
        const movieDate = new Date(movie.createdAt);
        return movieDate >= new Date(startDate) && movieDate <= new Date(endDate);
    });
    
    const movieData = filteredMovies.slice(0, 5).map(movie => ({
        name: movie.title,
        views: Math.floor(Math.random() * 1000) + 100
    }));
    
    movieStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: movieData.map(m => m.name),
            datasets: [{
                label: 'Lượt xem',
                data: movieData.map(m => m.views),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateUserStatsChart(startDate, endDate) {
    const ctx = document.getElementById('userStatsChart');
    if (!ctx) return;
    
    if (userStatsChart) {
        userStatsChart.destroy();
    }
    
    const filteredUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= new Date(startDate) && userDate <= new Date(endDate);
    });
    
    const userData = {
        total: filteredUsers.length,
        active: filteredUsers.filter(u => u.status === 'active').length,
        blocked: filteredUsers.filter(u => u.status === 'blocked').length
    };
    
    userStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tổng số', 'Hoạt động', 'Bị chặn'],
            datasets: [{
                data: [userData.total, userData.active, userData.blocked],
                backgroundColor: ['#667eea', '#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateRevenueStatsChart(startDate, endDate) {
    const ctx = document.getElementById('revenueStatsChart');
    if (!ctx) return;
    
    if (revenueStatsChart) {
        revenueStatsChart.destroy();
    }
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
    });
    
    const dailyRevenue = {};
    filteredBookings.forEach(booking => {
        const date = new Date(booking.createdAt).toDateString();
        dailyRevenue[date] = (dailyRevenue[date] || 0) + booking.totalPrice;
    });
    
    const dates = Object.keys(dailyRevenue);
    const revenues = Object.values(dailyRevenue);
    
    revenueStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenues,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatPrice(value);
                        }
                    }
                }
            }
        }
    });
}

function updateTopMoviesList(startDate, endDate) {
    const list = document.getElementById('topMoviesList');
    if (!list) return;
    
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
    });
    
    // Count bookings per movie
    const movieCounts = {};
    filteredBookings.forEach(booking => {
        movieCounts[booking.movieTitle] = (movieCounts[booking.movieTitle] || 0) + 1;
    });
    
    // Sort by count and take top 5
    const topMovies = Object.entries(movieCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    list.innerHTML = topMovies.map((movie, index) => `
        <div class="top-movie-item">
            <div class="top-movie-rank">${index + 1}</div>
            <div class="top-movie-info">
                <h4>${movie[0]}</h4>
                <p>${movie[1]} lượt đặt vé</p>
            </div>
            <div class="top-movie-views">${movie[1]}</div>
        </div>
    `).join('');
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
        return `${minutes} phút trước`;
    } else if (hours < 24) {
        return `${hours} giờ trước`;
    } else {
        return `${days} ngày trước`;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    notification.className = `notification show ${type === 'error' ? 'error' : ''}`;
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').classList.remove('show');
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Logout
function logout() {
    localStorage.removeItem('adminData');
    window.location.href = '/admin-login.html';
}

// View Functions
function viewBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    showNotification(`Xem chi tiết đặt vé #${booking.id.slice(0, 8)}`, 'success');
}

function cancelBooking(bookingId) {
    showConfirmModal(
        'Bạn có chắc chắn muốn hủy đặt vé này?',
        () => performCancelBooking(bookingId)
    );
}

async function performCancelBooking(bookingId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
        }
        
        renderBookingsTable();
        showNotification('Đặt vé đã được hủy thành công! ❌', 'success');
        closeModal('confirmModal');
        
    } catch (error) {
        showNotification('Lỗi khi hủy đặt vé', 'error');
    }
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => modal.classList.remove('show'));
    }
});

