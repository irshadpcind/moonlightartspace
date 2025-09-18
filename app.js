// Main App Controller
class LogicGamesApp {
    constructor() {
        this.currentScreen = 'home';
        this.threadlineGame = null;
        this.beeGame = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('home');
        console.log('Logic Games App initialized');
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const game = e.target.dataset.game;
                this.navigateTo(game);
            });
        });

        // Game cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const game = e.target.closest('.game-card').dataset.game;
                this.navigateTo(game);
            });
        });

        // Play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const game = e.target.closest('.game-card').dataset.game;
                this.navigateTo(game);
            });
        });

        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo('home');
            });
        });

        // Modal buttons
        document.getElementById('play-again')?.addEventListener('click', () => {
            this.hideModal();
            if (this.currentScreen === 'threadline') {
                this.threadlineGame?.newPuzzle();
            } else if (this.currentScreen === 'bee') {
                this.beeGame?.startNewLevel();
            }
        });

        document.getElementById('back-home')?.addEventListener('click', () => {
            this.hideModal();
            this.navigateTo('home');
        });

        // Close modal on outside click
        document.getElementById('success-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'success-modal') {
                this.hideModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('success-modal').classList.contains('active')) {
                    this.hideModal();
                } else if (this.currentScreen !== 'home') {
                    this.navigateTo('home');
                }
            }
        });
    }

    showScreen(screen) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        // Show target screen
        const targetScreen = document.getElementById(`${screen}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screen;

            // Update navigation
            const navBtn = document.querySelector(`[data-game="${screen}"]`);
            if (navBtn) {
                navBtn.classList.add('active');
            }
        }
    }

    navigateTo(screen) {
        if (screen === this.currentScreen) return;

        this.showScreen(screen);
        
        // Initialize games when navigating to them
        this.initializeGame(screen);
    }

    initializeGame(screen) {
        switch (screen) {
            case 'threadline':
                if (!this.threadlineGame) {
                    this.threadlineGame = new ThreadlineGame();
                }
                break;
            case 'bee':
                if (!this.beeGame) {
                    this.beeGame = new BeeGame();
                }
                break;
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loading.classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showModal(title, message, stats = null) {
        const modal = document.getElementById('success-modal');
        const titleEl = document.getElementById('success-title');
        const messageEl = document.getElementById('success-message');
        const timeEl = document.getElementById('completion-time');
        const movesEl = document.getElementById('total-moves');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        if (stats) {
            if (timeEl && stats.time) timeEl.textContent = stats.time;
            if (movesEl && stats.moves) movesEl.textContent = stats.moves;
        }

        modal.classList.add('active');
    }

    hideModal() {
        document.getElementById('success-modal').classList.remove('active');
    }

    // Utility methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Local storage helpers
    saveGameData(key, data) {
        try {
            localStorage.setItem(`logic-games-${key}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save game data:', e);
        }
    }

    loadGameData(key) {
        try {
            const data = localStorage.getItem(`logic-games-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Could not load game data:', e);
            return null;
        }
    }

    // Daily puzzle helpers
    getDailyPuzzleSeed() {
        const today = new Date();
        const dateString = today.getFullYear() + '-' + 
                          (today.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                          today.getDate().toString().padStart(2, '0');
        return this.hashString(dateString);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Random number generator with seed
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // Generate random integer between min and max (inclusive) with seed
    randomInt(min, max, seed) {
        return Math.floor(this.seededRandom(seed) * (max - min + 1)) + min;
    }

    // Shuffle array with seed
    shuffleArray(array, seed) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i, seed + i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.logicGamesApp = new LogicGamesApp();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
