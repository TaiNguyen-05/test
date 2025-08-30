// Kết nối Socket.IO
const socket = io();

// Biến global
let currentUser = null;
let movies = [];
let showtimes = [];
let selectedMovie = null;
let selectedShowtime = null;
let selectedSeats = [];
let userBookings = [];

// DOM Elements
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const moviesGrid = document.getElementById('moviesGrid');
const moviesGridApp = document.getElementById('moviesGridApp');
const mainContent = document.getElementById('mainContent');
const bookingSection = document.getElementById('bookingSection');
const movieDetails = document.getElementById('movieDetails');
const showtimesGrid = document.getElementById('showtimesGrid');
const seatSelection = document.getElementById('seatSelection');
const seatsGrid = document.getElementById('seatsGrid');
const bookingSummary = document.getElementById('bookingSummary');
const summaryDetails = document.getElementById('summaryDetails');
const confirmBookingBtn = document.getElementById('confirmBookingBtn');
const bookingsList = document.getElementById('bookingsList');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const closeNotification = document.getElementById('closeNotification');
const logoutBtn = document.getElementById('logoutBtn');

// Modal Elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
confirmBookingBtn.addEventListener('click', handleConfirmBooking);
closeNotification.addEventListener('click', hideNotification);
logoutBtn.addEventListener('click', handleLogout);

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
}

// Socket.IO Events
socket.on('movies', (moviesData) => {
    movies = moviesData;
    renderMoviesPreview();
    renderMoviesApp();
});

socket.on('showtimes', (showtimesData) => {
    showtimes = showtimesData;
});

socket.on('userRegistered', (user) => {
    currentUser = user;
    closeModal('registerModal');
    showMainContent();
    showNotification('Đăng ký thành công! 🎉', 'success');
    addSuccessEffect(document.body);
});

socket.on('userLoggedIn', (user) => {
    currentUser = user;
    closeModal('loginModal');
    showMainContent();
    showNotification('Đăng nhập thành công! 🎉', 'success');
    addSuccessEffect(document.body);
});

socket.on('authError', (error) => {
    showNotification(error, 'error');
});

socket.on('bookingConfirmed', (booking) => {
    userBookings.push(booking);
    renderUserBookings();
    showNotification('Đặt vé thành công! 🎬', 'success');
    addSuccessEffect(confirmBookingBtn);
    resetBookingForm();
});

socket.on('bookingError', (error) => {
    showNotification(error, 'error');
    addErrorEffect(confirmBookingBtn);
});

socket.on('ticketCancelled', (bookingId) => {
    userBookings = userBookings.filter(b => b.id !== bookingId);
    renderUserBookings();
    showNotification('Hủy vé thành công! ✅', 'success');
});

socket.on('seatsUpdated', (data) => {
    if (selectedShowtime && selectedShowtime.id === data.showtimeId) {
        selectedShowtime.availableSeats = data.availableSeats;
        renderShowtimes();
        addUpdateEffect(showtimesGrid);
    }
});

// Modal Functions
function showLoginForm() {
    loginModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function showRegisterForm() {
    registerModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset forms
    if (modalId === 'loginModal') {
        loginForm.reset();
    } else if (modalId === 'registerModal') {
        registerForm.reset();
    }
}

function switchToRegister() {
    closeModal('loginModal');
    setTimeout(() => showRegisterForm(), 300);
}

function switchToLogin() {
    closeModal('registerModal');
    setTimeout(() => showLoginForm(), 300);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Auth Functions
function handleLogin(e) {
    e.preventDefault();
    
    const loginData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
    submitBtn.disabled = true;
    
    socket.emit('login', loginData);
    
    // Reset button after 3 seconds if no response
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 3000);
}

function handleRegister(e) {
    e.preventDefault();
    
    const registerData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        phone: document.getElementById('registerPhone').value,
        password: document.getElementById('registerPassword').value
    };
    
    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
    submitBtn.disabled = true;
    
    socket.emit('register', registerData);
    
    // Reset button after 3 seconds if no response
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 3000);
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name') || e.target.querySelector('input[type="text"]').value,
        email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
        message: formData.get('message') || e.target.querySelector('textarea').value
    };
    
    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Đang gửi...';
    submitBtn.disabled = true;
    
    // Simulate sending (replace with actual API call)
    setTimeout(() => {
        showNotification('Tin nhắn đã được gửi thành công! 📧', 'success');
        e.target.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function showMainContent() {
    authButtons.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = currentUser.name;
    mainContent.style.display = 'block';
    
    // Hide homepage sections
    document.querySelector('.hero-section').style.display = 'none';
    document.querySelector('.features-section').style.display = 'none';
    document.querySelector('.movies-preview').style.display = 'none';
    document.querySelector('.about-section').style.display = 'none';
    document.querySelector('.contact-section').style.display = 'none';
    
    // Load vé của người dùng
    setTimeout(() => {
        loadUserBookings();
    }, 500); // Đợi một chút để đảm bảo user đã được set
    
    // Add entrance animation
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(50px)';
    
    setTimeout(() => {
        mainContent.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0)';
    }, 100);
}

function handleLogout() {
    currentUser = null;
    userBookings = [];
    selectedMovie = null;
    selectedShowtime = null;
    selectedSeats = [];
    
    // Add exit animation
    mainContent.style.transition = 'all 0.5s ease';
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(-50px)';
    
    setTimeout(() => {
        authButtons.style.display = 'flex';
        mainContent.style.display = 'none';
        userInfo.style.display = 'none';
        bookingSection.style.display = 'none';
        seatSelection.style.display = 'none';
        
        // Show homepage sections
        document.querySelector('.hero-section').style.display = 'grid';
        document.querySelector('.features-section').style.display = 'block';
        document.querySelector('.movies-preview').style.display = 'block';
        document.querySelector('.about-section').style.display = 'block';
        document.querySelector('.contact-section').style.display = 'block';
        
        // Reset main content styles
        mainContent.style.transition = '';
        mainContent.style.opacity = '';
        mainContent.style.transform = '';
    }, 500);
}

// Navigation Functions
function scrollToMovies() {
    document.getElementById('movies').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function showAllMovies() {
    if (currentUser) {
        showMainContent();
    } else {
        showRegisterForm();
    }
}

// Movie Functions
function renderMoviesPreview() {
    if (!moviesGrid) return;
    
    // Show only first 3 movies in preview
    const previewMovies = movies.slice(0, 3);
    
    moviesGrid.innerHTML = previewMovies.map((movie, index) => `
        <div class="movie-card" style="animation-delay: ${index * 0.1}s">
            <img src="${movie.image}" alt="${movie.title}" loading="lazy">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span><i class="fas fa-clock"></i> ${movie.duration}</span>
                    <span><i class="fas fa-star"></i> ${movie.rating}</span>
                </div>
                <div class="movie-genre">${movie.genre}</div>
                <button class="btn-book" onclick="selectMovie(${movie.id})">
                    <i class="fas fa-ticket-alt"></i> Đặt Vé
                </button>
            </div>
        </div>
    `).join('');
    
    // Add entrance animation
    const cards = moviesGrid.querySelectorAll('.movie-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function renderMoviesApp() {
    if (!moviesGridApp) return;
    
    moviesGridApp.innerHTML = movies.map((movie, index) => `
        <div class="movie-card" style="animation-delay: ${index * 0.1}s">
            <img src="${movie.image}" alt="${movie.title}" loading="lazy">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span><i class="fas fa-clock"></i> ${movie.duration}</span>
                    <span><i class="fas fa-star"></i> ${movie.rating}</span>
                </div>
                <div class="movie-genre">${movie.genre}</div>
                <button class="btn-book" onclick="selectMovie(${movie.id})">
                    <i class="fas fa-ticket-alt"></i> Đặt Vé
                </button>
            </div>
        </div>
    `).join('');
    
    // Add entrance animation
    const cards = moviesGridApp.querySelectorAll('.movie-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function selectMovie(movieId) {
    if (!currentUser) {
        showLoginForm();
        return;
    }
    
    selectedMovie = movies.find(m => m.id === movieId);
    selectedShowtime = null;
    selectedSeats = [];
    
    renderMovieDetails();
    renderShowtimes();
    bookingSection.style.display = 'block';
    seatSelection.style.display = 'none';
    
    // Add selection effect
    addSelectionEffect(bookingSection);
}

function renderMovieDetails() {
    movieDetails.innerHTML = `
        <h3><i class="fas fa-film"></i> ${selectedMovie.title}</h3>
        <div class="movie-meta">
            <span><i class="fas fa-clock"></i> Thời lượng: ${selectedMovie.duration}</span>
            <span><i class="fas fa-tags"></i> Thể loại: ${selectedMovie.genre}</span>
        </div>
    `;
    
    // Add entrance animation
    movieDetails.style.opacity = '0';
    movieDetails.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        movieDetails.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        movieDetails.style.opacity = '1';
        movieDetails.style.transform = 'scale(1)';
    }, 100);
}

function renderShowtimes() {
    const movieShowtimes = showtimes.filter(st => st.movieId === selectedMovie.id);
    
    showtimesGrid.innerHTML = movieShowtimes.map((showtime, index) => `
        <div class="showtime-card ${selectedShowtime && selectedShowtime.id === showtime.id ? 'selected' : ''}" 
             onclick="selectShowtime(${showtime.id})"
             style="animation-delay: ${index * 0.1}s">
            <h4><i class="fas fa-clock"></i> ${showtime.time}</h4>
            <div class="price"><i class="fas fa-money-bill-wave"></i> ${formatPrice(showtime.price)} VNĐ</div>
            <div class="seats"><i class="fas fa-chair"></i> Còn ${showtime.availableSeats} ghế</div>
        </div>
    `).join('');
    
    // Add entrance animation
    const cards = showtimesGrid.querySelectorAll('.showtime-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, index * 100);
    });
}

function selectShowtime(showtimeId) {
    selectedShowtime = showtimes.find(st => st.id === showtimeId);
    selectedSeats = [];
    
    renderShowtimes();
    renderSeats();
    seatSelection.style.display = 'block';
    updateBookingSummary();
    
    // Add selection effect
    addSelectionEffect(seatSelection);
}

function renderSeats() {
    const totalSeats = 80; // 8 hàng x 10 cột
    const bookedSeats = 80 - selectedShowtime.availableSeats;
    
    let seatsHTML = '';
    for (let i = 1; i <= totalSeats; i++) {
        const isBooked = i > selectedShowtime.availableSeats;
        const isSelected = selectedSeats.includes(i);
        
        let seatClass = 'seat available';
        if (isBooked) seatClass = 'seat booked';
        if (isSelected) seatClass = 'seat selected';
        
        seatsHTML += `
            <div class="${seatClass}" 
                 onclick="toggleSeat(${i})" 
                 data-seat="${i}"
                 style="animation-delay: ${i * 0.01}s">
                ${i}
            </div>
        `;
    }
    
    seatsGrid.innerHTML = seatsHTML;
    
    // Add entrance animation
    const seats = seatsGrid.querySelectorAll('.seat');
    seats.forEach((seat, index) => {
        seat.style.opacity = '0';
        seat.style.transform = 'scale(0)';
        
        setTimeout(() => {
            seat.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            seat.style.opacity = '1';
            seat.style.transform = 'scale(1)';
        }, index * 10);
    });
}

function toggleSeat(seatNumber) {
    const seatElement = document.querySelector(`[data-seat="${seatNumber}"]`);
    
    if (seatElement.classList.contains('booked')) {
        addErrorEffect(seatElement);
        return; // Không thể chọn ghế đã đặt
    }
    
    if (selectedSeats.includes(seatNumber)) {
        selectedSeats = selectedSeats.filter(s => s !== seatNumber);
        seatElement.classList.remove('selected');
        seatElement.classList.add('available');
        addDeselectionEffect(seatElement);
    } else {
        selectedSeats.push(seatNumber);
        seatElement.classList.remove('available');
        seatElement.classList.add('selected');
        addSelectionEffect(seatElement);
    }
    
    updateBookingSummary();
}

function updateBookingSummary() {
    if (!selectedShowtime || selectedSeats.length === 0) {
        summaryDetails.innerHTML = '<p style="text-align: center; color: #666;"><i class="fas fa-info-circle"></i> Vui lòng chọn suất chiếu và ghế</p>';
        return;
    }
    
    const totalPrice = selectedShowtime.price * selectedSeats.length;
    
    summaryDetails.innerHTML = `
        <div class="summary-item">
            <span><i class="fas fa-film"></i> Phim:</span>
            <span>${selectedMovie.title}</span>
        </div>
        <div class="summary-item">
            <span><i class="fas fa-clock"></i> Suất chiếu:</span>
            <span>${selectedShowtime.time} - ${selectedShowtime.date}</span>
        </div>
        <div class="summary-item">
            <span><i class="fas fa-chair"></i> Ghế đã chọn:</span>
            <span>${selectedSeats.join(', ')}</span>
        </div>
        <div class="summary-item">
            <span><i class="fas fa-money-bill-wave"></i> Giá vé:</span>
            <span>${formatPrice(selectedShowtime.price)} VNĐ</span>
        </div>
        <div class="summary-item">
            <span><i class="fas fa-calculator"></i> Tổng tiền:</span>
            <span>${formatPrice(totalPrice)} VNĐ</span>
        </div>
    `;
    
    // Add update effect
    addUpdateEffect(bookingSummary);
}

function handleConfirmBooking() {
    if (!selectedShowtime || selectedSeats.length === 0) {
        showNotification('Vui lòng chọn suất chiếu và ghế', 'error');
        addErrorEffect(confirmBookingBtn);
        return;
    }
    
    if (!currentUser) {
        showNotification('Vui lòng đăng nhập để đặt vé', 'error');
        addErrorEffect(confirmBookingBtn);
        return;
    }
    
    // Add loading state
    const originalText = confirmBookingBtn.innerHTML;
    confirmBookingBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
    confirmBookingBtn.disabled = true;
    
    const bookingData = {
        userId: currentUser.id,
        showtimeId: selectedShowtime.id,
        seats: selectedSeats,
        totalPrice: selectedShowtime.price * selectedSeats.length
    };
    
    // Sử dụng API thay vì Socket.IO
    fetch('/api/bookings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            // Thêm vé mới vào mảng local ngay lập tức
            if (result.booking) {
                userBookings.unshift(result.booking); // Thêm vào đầu mảng
                renderUserBookings(); // Hiển thị ngay
            }
            showNotification('Đặt vé thành công! 🎬', 'success');
            addSuccessEffect(confirmBookingBtn);
            resetBookingForm();
        } else {
            showNotification(result.error || 'Lỗi khi đặt vé', 'error');
            addErrorEffect(confirmBookingBtn);
        }
    })
    .catch(error => {
        console.error('Error booking ticket:', error);
        showNotification('Lỗi khi đặt vé: ' + error.message, 'error');
        addErrorEffect(confirmBookingBtn);
    })
    .finally(() => {
        // Reset button
        confirmBookingBtn.innerHTML = originalText;
        confirmBookingBtn.disabled = false;
    });
}

function resetBookingForm() {
    selectedMovie = null;
    selectedShowtime = null;
    selectedSeats = [];
    bookingSection.style.display = 'none';
    seatSelection.style.display = 'none';
}

// Load vé của người dùng từ API
async function loadUserBookings() {
    if (!currentUser) {
        userBookings = [];
        renderUserBookings();
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${currentUser.id}/bookings`);
        if (response.ok) {
            userBookings = await response.json();
            console.log('Loaded user bookings:', userBookings); // Debug log
        } else {
            console.error('Error loading user bookings:', response.statusText);
            userBookings = [];
        }
    } catch (error) {
        console.error('Error loading user bookings:', error);
        userBookings = [];
    }
    
    renderUserBookings();
}

function renderUserBookings() {
    console.log('Rendering user bookings:', userBookings); // Debug log
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.1rem;"><i class="fas fa-ticket-alt"></i> Bạn chưa có vé nào</p>';
        return;
    }
    
    bookingsList.innerHTML = userBookings.map((booking, index) => `
        <div class="booking-card" style="animation-delay: ${index * 0.1}s">
            <div class="booking-header">
                <span class="booking-id"><i class="fas fa-hashtag"></i> #${booking.id.slice(0, 8)}</span>
                <span class="booking-status confirmed"><i class="fas fa-check-circle"></i> Đã xác nhận</span>
            </div>
            <div class="booking-details">
                <div class="booking-detail">
                    <label><i class="fas fa-film"></i> Phim</label>
                    <span>${booking.movieTitle}</span>
                </div>
                <div class="booking-detail">
                    <label><i class="fas fa-clock"></i> Suất chiếu</label>
                    <span>${booking.time || 'N/A'} - ${booking.date || 'N/A'}</span>
                </div>
                <div class="booking-detail">
                    <label><i class="fas fa-chair"></i> Ghế</label>
                    <span>${Array.isArray(booking.seats) ? booking.seats.join(', ') : (typeof booking.seats === 'string' ? JSON.parse(booking.seats).join(', ') : 'N/A')}</span>
                </div>
                <div class="booking-detail">
                    <label><i class="fas fa-money-bill-wave"></i> Tổng tiền</label>
                    <span>${formatPrice(booking.totalPrice)} VNĐ</span>
                </div>
            </div>
            <button class="btn-cancel" onclick="cancelTicket('${booking.id}')">
                <i class="fas fa-times"></i> Hủy Vé
            </button>
        </div>
    `).join('');
    
    // Add entrance animation
    const cards = bookingsList.querySelectorAll('.booking-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function cancelTicket(bookingId) {
    if (confirm('Bạn có chắc chắn muốn hủy vé này?')) {
        // Sử dụng API thay vì Socket.IO
        fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                // Xóa vé khỏi mảng local ngay lập tức
                userBookings = userBookings.filter(b => b.id !== bookingId);
                renderUserBookings(); // Hiển thị ngay
                showNotification('Hủy vé thành công! ✅', 'success');
            } else {
                showNotification(result.error || 'Lỗi khi hủy vé', 'error');
            }
        })
        .catch(error => {
            console.error('Error cancelling ticket:', error);
            showNotification('Lỗi khi hủy vé: ' + error.message, 'error');
        });
    }
}

function showNotification(message, type = 'success') {
    notificationMessage.innerHTML = message;
    notification.className = `notification show ${type === 'error' ? 'error' : ''}`;
    
    // Add entrance effect
    addNotificationEffect(notification);
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    notification.classList.remove('show');
}

function formatPrice(price) {
    return price.toLocaleString('vi-VN');
}

// Effect Functions
function addSuccessEffect(element) {
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 600);
}

function addErrorEffect(element) {
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 500);
}

function addSelectionEffect(element) {
    element.style.transform = 'scale(1.02)';
    element.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '';
    }, 300);
}

function addDeselectionEffect(element) {
    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function addUpdateEffect(element) {
    element.style.transform = 'scale(1.01)';
    element.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.2)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '';
    }, 300);
}

function addNotificationEffect(element) {
    element.style.transform = 'translateX(0) scale(1)';
    element.style.opacity = '1';
}

// Navigation Active State
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderMoviesPreview();
    loadUserBookings(); // Load bookings when the page loads
    
    // Add floating effect to logo
    const logo = document.querySelector('.logo i');
    if (logo) {
        logo.classList.add('floating');
    }
    
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });
    
    // Update navigation on scroll
    window.addEventListener('scroll', updateActiveNav);
    
    // Initialize active nav
    updateActiveNav();
});
