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
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);
if (confirmBookingBtn) confirmBookingBtn.addEventListener('click', handleConfirmBooking);
if (closeNotification) closeNotification.addEventListener('click', hideNotification);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
}

// Load dữ liệu ban đầu
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired');
    console.log('Starting to load data...');
    
    // Kiểm tra user đã đăng nhập
    checkLoginStatus();
    
    try {
        // Load dữ liệu song song
        const [moviesResult, showtimesResult] = await Promise.all([
            loadMovies(),
            loadShowtimes()
        ]);
        
        console.log('Movies and showtimes loaded, loading user bookings...');
        await loadUserBookings();
        
        console.log('All data loaded, rendering movies...');
        console.log('Movies array before render:', movies);
        console.log('Showtimes array before render:', showtimes);
        
        renderMoviesPreview();
        renderMoviesApp();
    } catch (error) {
        console.error('Error loading data:', error);
        
        // Fallback: render với dữ liệu mặc định nếu có
        if (movies.length > 0) {
            console.log('Rendering with fallback data...');
            renderMoviesPreview();
            renderMoviesApp();
        }
    }
    
    // Fallback timeout để đảm bảo movies được hiển thị
    setTimeout(() => {
        console.log('Fallback timeout - checking if movies need to be rendered...');
        if (movies.length > 0 && (!document.querySelector('.movie-card') || document.querySelectorAll('.movie-card').length === 0)) {
            console.log('Rendering movies from fallback timeout...');
            renderMoviesPreview();
            renderMoviesApp();
        }
    }, 2000);
    
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
});

// Load dữ liệu từ API
async function loadMovies() {
    try {
        console.log('Loading movies...');
        const response = await fetch('/api/movies');
        console.log('Movies response:', response);
        
        if (response.ok) {
            movies = await response.json();
            console.log('Loaded movies:', movies);
            console.log('Movies array length:', movies.length);
        } else {
            console.error('Error response:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

async function loadShowtimes() {
    try {
        const response = await fetch('/api/showtimes');
        if (response.ok) {
            showtimes = await response.json();
            console.log('Loaded showtimes:', showtimes);
        }
    } catch (error) {
        console.error('Error loading showtimes:', error);
    }
}

// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            showMainContent();
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('currentUser');
        }
    }
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
            console.log('Loaded user bookings:', userBookings);
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

// Modal Functions
function showLoginForm() {
    if (loginModal) {
        loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function showRegisterForm() {
    if (registerModal) {
        registerModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset forms
        if (modalId === 'loginModal' && loginForm) {
            loginForm.reset();
        } else if (modalId === 'registerModal' && registerForm) {
            registerForm.reset();
        }
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
async function handleLogin(e) {
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
    
    try {
        // Gọi API đăng nhập
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            // Lưu thông tin user vào localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            closeModal('loginModal');
            showMainContent();
            showNotification('Đăng nhập thành công! 🎉', 'success');
            addSuccessEffect(document.body);
        } else {
            showNotification(result.error || 'Lỗi khi đăng nhập', 'error');
        }
        
    } catch (error) {
        showNotification('Lỗi khi đăng nhập: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
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
    
    try {
        // Gọi API đăng ký
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            // Lưu thông tin user vào localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            closeModal('registerModal');
            showMainContent();
            showNotification('Đăng ký thành công! 🎉', 'success');
            addSuccessEffect(document.body);
        } else {
            showNotification(result.error || 'Lỗi khi đăng ký', 'error');
        }
        
    } catch (error) {
        showNotification('Lỗi khi đăng ký: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
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
    if (authButtons) authButtons.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (userName) userName.textContent = currentUser.name;
    if (mainContent) mainContent.style.display = 'block';
    
    // Hide homepage sections
    const heroSection = document.querySelector('.hero-section');
    const featuresSection = document.querySelector('.features-section');
    const moviesPreview = document.querySelector('.movies-preview');
    const aboutSection = document.querySelector('.about-section');
    const contactSection = document.querySelector('.contact-section');
    
    if (heroSection) heroSection.style.display = 'none';
    if (featuresSection) featuresSection.style.display = 'none';
    if (moviesPreview) moviesPreview.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (contactSection) contactSection.style.display = 'none';
    
    // Load vé của người dùng
    setTimeout(() => {
        loadUserBookings();
    }, 500);
    
    // Add entrance animation
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            mainContent.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }, 100);
    }
}

function handleLogout() {
    currentUser = null;
    userBookings = [];
    selectedMovie = null;
    selectedShowtime = null;
    selectedSeats = [];
    
    // Xóa thông tin user khỏi localStorage
    localStorage.removeItem('currentUser');
    
    // Add exit animation
    if (mainContent) {
        mainContent.style.transition = 'all 0.5s ease';
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(-50px)';
    }
    
    setTimeout(() => {
        if (authButtons) authButtons.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (bookingSection) bookingSection.style.display = 'none';
        if (seatSelection) seatSelection.style.display = 'none';
        
        // Show homepage sections
        const heroSection = document.querySelector('.hero-section');
        const featuresSection = document.querySelector('.features-section');
        const moviesPreview = document.querySelector('.movies-preview');
        const aboutSection = document.querySelector('.about-section');
        const contactSection = document.querySelector('.contact-section');
        
        if (heroSection) heroSection.style.display = 'grid';
        if (featuresSection) featuresSection.style.display = 'block';
        if (moviesPreview) moviesPreview.style.display = 'block';
        if (aboutSection) aboutSection.style.display = 'block';
        if (contactSection) contactSection.style.display = 'block';
        
        // Reset main content styles
        if (mainContent) {
            mainContent.style.transition = '';
            mainContent.style.opacity = '';
            mainContent.style.transform = '';
        }
    }, 500);
}

// Navigation Functions
function scrollToMovies() {
    const moviesSection = document.getElementById('movies');
    if (moviesSection) {
        moviesSection.scrollIntoView({ behavior: 'smooth' });
    }
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
    console.log('renderMoviesPreview called');
    console.log('moviesGrid exists:', !!moviesGrid);
    console.log('movies array:', movies);
    console.log('movies array length:', movies.length);
    
    if (!moviesGrid) {
        console.log('moviesGrid not found, returning');
        return;
    }
    
    // Show only first 3 movies in preview
    const previewMovies = movies.slice(0, 3);
    console.log('previewMovies:', previewMovies);
    
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
    console.log('renderMoviesApp called');
    console.log('moviesGridApp exists:', !!moviesGridApp);
    console.log('movies array in renderMoviesApp:', movies);
    
    if (!moviesGridApp) {
        console.log('moviesGridApp not found, returning');
        return;
    }
    
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
    if (bookingSection) bookingSection.style.display = 'block';
    if (seatSelection) seatSelection.style.display = 'none';
    
    // Add selection effect
    if (bookingSection) addSelectionEffect(bookingSection);
}

function renderMovieDetails() {
    if (!movieDetails || !selectedMovie) return;
    
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
    if (!showtimesGrid || !selectedMovie) return;
    
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

async function selectShowtime(showtimeId) {
    selectedShowtime = showtimes.find(st => st.id === showtimeId);
    selectedSeats = [];
    
    renderShowtimes();
    await renderSeats(); // Đợi renderSeats hoàn thành
    if (seatSelection) seatSelection.style.display = 'block';
    updateBookingSummary();
    
    // Add selection effect
    if (seatSelection) addSelectionEffect(seatSelection);
}

async function renderSeats() {
    if (!seatsGrid || !selectedShowtime) return;
    
    // Hiển thị loading trước
    seatsGrid.innerHTML = '<div class="seats-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải thông tin ghế...</div>';
    
    try {
        // Lấy thông tin ghế đã đặt từ API
        const response = await fetch(`/api/showtimes/${selectedShowtime.id}/seats`);
        if (!response.ok) {
            throw new Error('Không thể lấy thông tin ghế');
        }
        
        const seatsData = await response.json();
        console.log('Seats data:', seatsData); // Debug log
        
        const totalSeats = 80; // 8 hàng x 10 cột
        const bookedSeats = seatsData.bookedSeats || [];
        
        let seatsHTML = '';
        for (let i = 1; i <= totalSeats; i++) {
            const isBooked = bookedSeats.includes(i);
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
        
        // Cập nhật thông tin ghế còn trống
        if (seatsData.availableSeats !== undefined) {
            selectedShowtime.availableSeats = seatsData.availableSeats;
        }
        
    } catch (error) {
        console.error('Error loading seats:', error);
        // Fallback: sử dụng logic cũ nếu API thất bại
        const totalSeats = 80;
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
    if (!summaryDetails || !selectedShowtime || selectedSeats.length === 0) return;
    
    const totalPrice = selectedShowtime.price * selectedSeats.length;
    
    summaryDetails.innerHTML = `
        <div class="summary-item">
            <span><i class="fas fa-film"></i> Phim:</span>
            <span>${selectedMovie ? selectedMovie.title : 'N/A'}</span>
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
    
    // Hiển thị phần thanh toán
    showPaymentSection();
    
    // Add update effect
    if (bookingSummary) addUpdateEffect(bookingSummary);
}

// Payment Functions
function showPaymentSection() {
    const paymentSection = document.getElementById('paymentSection');
    if (paymentSection) {
        paymentSection.style.display = 'block';
        // Reset payment selection
        const radioButtons = document.querySelectorAll('input[name="paymentMethod"]');
        radioButtons.forEach(radio => radio.checked = false);
        hideBankDetails();
    }
}

function selectPaymentMethod(method) {
    // Uncheck all radio buttons first
    const radioButtons = document.querySelectorAll('input[name="paymentMethod"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Check the selected method
    if (method === 'cash') {
        document.getElementById('cashPayment').checked = true;
        hideBankDetails();
    } else if (method === 'bank') {
        document.getElementById('bankPayment').checked = true;
        showBankDetails();
        updateTransferContent();
    }
}

function showBankDetails() {
    const bankDetails = document.getElementById('bankDetails');
    if (bankDetails) {
        bankDetails.style.display = 'block';
        // Add entrance animation
        bankDetails.style.opacity = '0';
        bankDetails.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            bankDetails.style.transition = 'all 0.5s ease';
            bankDetails.style.opacity = '1';
            bankDetails.style.transform = 'translateY(0)';
        }, 100);
    }
}

function hideBankDetails() {
    const bankDetails = document.getElementById('bankDetails');
    if (bankDetails) {
        bankDetails.style.display = 'none';
    }
}

function updateTransferContent() {
    const transferContent = document.getElementById('transferContent');
    if (transferContent && selectedSeats && selectedSeats.length > 0) {
        // Tạo nội dung chuyển khoản với số ghế đã chọn
        const content = `CINEMA ${selectedSeats.join(',')}`;
        transferContent.textContent = content;
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Đã sao chép vào clipboard! 📋', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Đã sao chép vào clipboard! 📋', 'success');
    } catch (err) {
        showNotification('Không thể sao chép, vui lòng sao chép thủ công', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Cập nhật hàm handleConfirmBooking để kiểm tra phương thức thanh toán
function handleConfirmBooking() {
    if (!selectedShowtime || selectedSeats.length === 0) {
        showNotification('Vui lòng chọn suất chiếu và ghế', 'error');
        if (confirmBookingBtn) addErrorEffect(confirmBookingBtn);
        return;
    }
    
    if (!currentUser) {
        showNotification('Vui lòng đăng nhập để đặt vé', 'error');
        if (confirmBookingBtn) addErrorEffect(confirmBookingBtn);
        return;
    }
    
    // Kiểm tra phương thức thanh toán
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedPaymentMethod) {
        showNotification('Vui lòng chọn phương thức thanh toán', 'error');
        if (confirmBookingBtn) addErrorEffect(confirmBookingBtn);
        return;
    }
    
    // Add loading state
    if (!confirmBookingBtn) return;
    
    const originalText = confirmBookingBtn.innerHTML;
    confirmBookingBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
    confirmBookingBtn.disabled = true;
    
    const paymentMethod = selectedPaymentMethod.value;
    const bookingData = {
        userId: currentUser.id,
        showtimeId: selectedShowtime.id,
        seats: selectedSeats,
        totalPrice: selectedShowtime.price * selectedSeats.length,
        paymentMethod: paymentMethod
    };
    
    // Sử dụng API để đặt vé
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
            
            // Hiển thị thông báo tùy theo phương thức thanh toán
            if (paymentMethod === 'cash') {
                showNotification('Đặt vé thành công! Vui lòng thanh toán tiền mặt tại rạp 🎬', 'success');
            } else if (paymentMethod === 'bank') {
                showNotification('Đặt vé thành công! Vui lòng chuyển khoản theo thông tin bên trên 🏦', 'success');
            }
            
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
    if (bookingSection) bookingSection.style.display = 'none';
    if (seatSelection) seatSelection.style.display = 'none';
    
    // Ẩn phần thanh toán
    const paymentSection = document.getElementById('paymentSection');
    if (paymentSection) paymentSection.style.display = 'none';
    
    // Reset payment selection
    const radioButtons = document.querySelectorAll('input[name="paymentMethod"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Ẩn thông tin ngân hàng
    hideBankDetails();
}

function renderUserBookings() {
    if (!bookingsList) return;
    
    console.log('Rendering user bookings:', userBookings);
    
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
        // Sử dụng API để hủy vé
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
    if (!notification || !notificationMessage) return;
    
    notificationMessage.innerHTML = message;
    notification.className = `notification show ${type === 'error' ? 'error' : ''}`;
    
    // Add entrance effect
    addNotificationEffect(notification);
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    if (notification) {
        notification.classList.remove('show');
    }
}

function formatPrice(price) {
    return price.toLocaleString('vi-VN');
}

// Effect Functions
function addSuccessEffect(element) {
    if (!element) return;
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 600);
}

function addErrorEffect(element) {
    if (!element) return;
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 500);
}

function addSelectionEffect(element) {
    if (!element) return;
    element.style.transform = 'scale(1.02)';
    element.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '';
    }, 300);
}

function addDeselectionEffect(element) {
    if (!element) return;
    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function addUpdateEffect(element) {
    if (!element) return;
    element.style.transform = 'scale(1.01)';
    element.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.2)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '';
    }, 300);
}

function addNotificationEffect(element) {
    if (!element) return;
    element.style.transform = 'translateX(0) scale(1)';
    element.style.opacity = '1';
}
