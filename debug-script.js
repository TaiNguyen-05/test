// Test script để debug việc load dữ liệu
console.log('Debug script loaded');

// Test load movies
async function testLoadMovies() {
    try {
        console.log('Testing loadMovies...');
        const response = await fetch('/api/movies');
        console.log('Response:', response);
        
        if (response.ok) {
            const movies = await response.json();
            console.log('Movies loaded:', movies);
            console.log('Movies count:', movies.length);
            return movies;
        } else {
            console.error('Error loading movies:', response.status, response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Exception loading movies:', error);
        return [];
    }
}

// Test load showtimes
async function testLoadShowtimes() {
    try {
        console.log('Testing loadShowtimes...');
        const response = await fetch('/api/showtimes');
        console.log('Response:', response);
        
        if (response.ok) {
            const showtimes = await response.json();
            console.log('Showtimes loaded:', showtimes);
            console.log('Showtimes count:', showtimes.length);
            return showtimes;
        } else {
            console.error('Error loading showtimes:', response.status, response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Exception loading showtimes:', error);
        return [];
    }
}

// Test render movies
function testRenderMovies(movies) {
    console.log('Testing renderMovies with:', movies);
    
    const moviesGrid = document.getElementById('moviesGrid');
    const moviesGridApp = document.getElementById('moviesGridApp');
    
    console.log('moviesGrid exists:', !!moviesGrid);
    console.log('moviesGridApp exists:', !!moviesGridApp);
    
    if (moviesGrid && movies.length > 0) {
        const previewMovies = movies.slice(0, 3);
        console.log('Preview movies:', previewMovies);
        
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
                    <button class="btn-book" onclick="alert('Selected: ${movie.title}')">
                        <i class="fas fa-ticket-alt"></i> Đặt Vé
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('Movies rendered in moviesGrid');
    }
    
    if (moviesGridApp && movies.length > 0) {
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
                    <button class="btn-book" onclick="alert('Selected: ${movie.title}')">
                        <i class="fas fa-ticket-alt"></i> Đặt Vé
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('Movies rendered in moviesGridApp');
    }
}

// Main test function
async function runTests() {
    console.log('Running tests...');
    
    // Test load movies
    const movies = await testLoadMovies();
    
    // Test load showtimes
    const showtimes = await testLoadShowtimes();
    
    // Test render movies
    if (movies.length > 0) {
        testRenderMovies(movies);
    } else {
        console.error('No movies to render');
    }
    
    console.log('Tests completed');
}

// Run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
} else {
    runTests();
}

// Export functions for testing
window.debugScript = {
    testLoadMovies,
    testLoadShowtimes,
    testRenderMovies,
    runTests
};
