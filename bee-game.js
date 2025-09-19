// Don't Bug the Bee Game Implementation
class BeeGame {
    constructor() {
        this.gridSize = 5; // Default 5x5, changes to 6x6 for set 5
        this.grid = [];
        this.beePosition = null;
        this.flowerPosition = null;
        this.bugPositions = [];
        this.path = [];
        this.pathLines = []; // Store visual path lines
        this.currentLevel = 1;
        this.currentSet = 1;
        this.maxSets = 5;
        this.lives = 3;
        this.score = 0;
        this.gameState = 'ready'; // ready, showing-bugs, drawing-path, completed, failed
        this.startTime = null;
        this.isDrawing = false;
        
        // Level configuration - progressive difficulty with timing
        this.levelConfig = [
            { set: 1, gridSize: 5, bugCount: 2, bugDisplayTime: 2000 },   // 2 seconds
            { set: 2, gridSize: 5, bugCount: 3, bugDisplayTime: 1500 },   // 1.5 seconds
            { set: 3, gridSize: 5, bugCount: 4, bugDisplayTime: 1400 },   // 1.4 seconds
            { set: 4, gridSize: 5, bugCount: 5, bugDisplayTime: 1300 },   // 1.3 seconds
            { set: 5, gridSize: 6, bugCount: 6, bugDisplayTime: 1300 }    // 1.3 seconds
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateSet();
        this.renderGrid();
        this.updateStatus();
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('bee-start')?.addEventListener('click', () => {
            this.startSet();
        });

        document.getElementById('bee-reset')?.addEventListener('click', () => {
            this.resetPath();
        });

        document.getElementById('bee-new-level')?.addEventListener('click', () => {
            this.startNewLevel();
        });

        // Global mouse events for better drag experience
        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });
    }

    generateSet() {
        const config = this.levelConfig[this.currentSet - 1];
        this.gridSize = config.gridSize;
        
        // Initialize empty grid
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => ({ 
                type: 'empty',
                hasBug: false,
                visited: false
            }))
        );

        // Generate positions with some randomization but seeded for fairness
        const seed = this.currentLevel * 1000 + this.currentSet * 100 + Date.now() % 100;
        const positions = this.generatePositions(seed);

        // Place bee (always top-left area)
        this.beePosition = positions.bee;
        this.grid[this.beePosition.row][this.beePosition.col].type = 'bee';

        // Place flower (always bottom-right area)
        this.flowerPosition = positions.flower;
        this.grid[this.flowerPosition.row][this.flowerPosition.col].type = 'flower';

        // Place bugs
        this.bugPositions = positions.bugs;
        this.bugPositions.forEach(bug => {
            this.grid[bug.row][bug.col].hasBug = true;
        });

        // Reset path and state
        this.path = [];
        this.pathLines = [];
        this.gameState = 'ready';
    }

    generatePositions(seed) {
        const positions = { bee: null, flower: null, bugs: [] };
        const config = this.levelConfig[this.currentSet - 1];
        
        // Generate bee position (top-left quadrant)
        const beeRow = window.logicGamesApp.randomInt(0, Math.floor(this.gridSize / 2), seed);
        const beeCol = window.logicGamesApp.randomInt(0, Math.floor(this.gridSize / 2), seed + 1);
        positions.bee = { row: beeRow, col: beeCol };

        // Generate flower position (bottom-right quadrant)
        const flowerRow = window.logicGamesApp.randomInt(
            Math.ceil(this.gridSize / 2), 
            this.gridSize - 1, 
            seed + 2
        );
        const flowerCol = window.logicGamesApp.randomInt(
            Math.ceil(this.gridSize / 2), 
            this.gridSize - 1, 
            seed + 3
        );
        positions.flower = { row: flowerRow, col: flowerCol };

        // Generate bug positions (avoid bee and flower)
        const occupiedPositions = new Set([
            `${beeRow},${beeCol}`,
            `${flowerRow},${flowerCol}`
        ]);

        for (let i = 0; i < config.bugCount; i++) {
            let bugRow, bugCol, positionKey;
            let attempts = 0;
            
            do {
                bugRow = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed + 10 + i + attempts);
                bugCol = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed + 20 + i + attempts);
                positionKey = `${bugRow},${bugCol}`;
                attempts++;
            } while (occupiedPositions.has(positionKey) && attempts < 50);

            if (attempts < 50) {
                positions.bugs.push({ row: bugRow, col: bugCol });
                occupiedPositions.add(positionKey);
            }
        }

        return positions;
    }

    renderGrid() {
        const container = document.getElementById('bee-grid');
        if (!container) return;

        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.createCell(row, col);
                container.appendChild(cell);
            }
        }

        // Render path lines
        this.renderPathLines();
    }

    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'bee-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const gridCell = this.grid[row][col];

        // Show bugs during flash phase ONLY
        if (this.gameState === 'showing-bugs' && gridCell.hasBug) {
            cell.classList.add('bug');
            cell.textContent = '🐛';
        }
        // Show bee and flower only during drawing phase (after bugs disappear)
        else if (this.gameState === 'drawing-path') {
            if (gridCell.type === 'bee') {
                cell.classList.add('bee');
                cell.textContent = '🐝';
            } else if (gridCell.type === 'flower') {
                cell.classList.add('flower');
                cell.textContent = '🌸';
            }
        }
        // During ready state, show nothing (empty grid)
        else if (this.gameState === 'ready') {
            // Empty cells only
        }

        // Show path - make it visible even on flower tile
        if (gridCell.visited) {
            cell.classList.add('path');
            // Add a strong path indicator for better visibility on flower
            if (gridCell.type === 'flower') {
                cell.style.boxShadow = 'inset 0 0 0 6px #22c55e, 0 0 12px rgba(34, 197, 94, 0.5)';
                cell.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                cell.style.border = '4px solid #22c55e';
            }
        }

        // Add event listeners for path drawing
        if (this.gameState === 'drawing-path') {
            cell.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleCellMouseDown(e, row, col);
            });

            cell.addEventListener('mouseenter', (e) => {
                if (this.isDrawing) {
                    this.handleCellMouseEnter(e, row, col);
                }
            });

            cell.addEventListener('mouseup', (e) => {
                this.handleCellMouseUp(e, row, col);
            });

            // Touch events for mobile with scroll prevention
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                this.handleCellMouseDown(e, row, col);
            }, { passive: false });

            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isDrawing) {
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.classList.contains('bee-cell')) {
                        const touchRow = parseInt(element.dataset.row);
                        const touchCol = parseInt(element.dataset.col);
                        this.handleCellMouseEnter(e, touchRow, touchCol);
                    }
                }
            }, { passive: false });

            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.style.overflow = ''; // Re-enable scrolling
                this.isDrawing = false;
            }, { passive: false });
        }

        // Prevent context menu
        cell.addEventListener('contextmenu', (e) => e.preventDefault());

        return cell;
    }

    startSet() {
        if (this.gameState !== 'ready') return;

        this.gameState = 'showing-bugs';
        this.startTime = Date.now();

        // Bug flash phase started

        // Show bugs for the configured time based on current set
        const config = this.levelConfig[this.currentSet - 1];
        this.renderGrid();

        setTimeout(() => {
            this.gameState = 'drawing-path';
            this.renderGrid();
            
            // Path drawing phase started

            // Update button states
            const startBtn = document.getElementById('bee-start');
            const resetBtn = document.getElementById('bee-reset');
            if (startBtn) startBtn.disabled = true;
            if (resetBtn) resetBtn.disabled = false;

        }, config.bugDisplayTime);
    }

    handleCellMouseDown(e, row, col) {
        if (this.gameState !== 'drawing-path') return;

        // Can only start from bee position
        if (this.path.length === 0) {
            if (row === this.beePosition.row && col === this.beePosition.col) {
                this.isDrawing = true;
                this.addToPath(row, col);
            }
        } else {
            // Continue drawing from last position
            const lastPos = this.path[this.path.length - 1];
            if (lastPos.row === row && lastPos.col === col) {
                this.isDrawing = true;
            }
        }
    }

    handleCellMouseEnter(e, row, col) {
        if (!this.isDrawing || this.gameState !== 'drawing-path') return;
        this.continueDrawing(row, col);
    }

    handleCellMouseUp(e, row, col) {
        this.isDrawing = false;
    }

    continueDrawing(row, col) {
        if (this.path.length === 0) return;

        const lastPos = this.path[this.path.length - 1];
        
        // Don't add same cell twice
        if (lastPos.row === row && lastPos.col === col) return;
        
        // Check if this is an undo operation (going backwards)
        if (this.path.length >= 2) {
            const secondLastPos = this.path[this.path.length - 2];
            if (secondLastPos.row === row && secondLastPos.col === col) {
                this.undoLastMove();
                return;
            }
        }
        
        // Check if adjacent
        if (!this.isAdjacent(lastPos.row, lastPos.col, row, col)) {
            return;
        }

        // Check if valid move
        if (this.isValidMove(row, col)) {
            this.addToPath(row, col);
        }
    }

    undoLastMove() {
        if (this.path.length <= 1) return;

        // Remove last position from path
        const removedPos = this.path.pop();
        
        // Remove last path line
        if (this.pathLines.length > 0) {
            this.pathLines.pop();
        }

        // Unmark as visited
        this.grid[removedPos.row][removedPos.col].visited = false;

        this.renderGrid();
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    isValidMove(row, col) {
        // Can't revisit cells
        if (this.grid[row][col].visited) return false;

        // Can move to empty cells, bee, or flower
        return true;
    }

    addToPath(row, col) {
        // Add path line if not the first cell
        if (this.path.length > 0) {
            const lastPos = this.path[this.path.length - 1];
            this.pathLines.push({
                from: { row: lastPos.row, col: lastPos.col },
                to: { row, col }
            });
        }

        // Add to path
        this.path.push({ row, col });
        this.grid[row][col].visited = true;

        // Check if hit a bug
        if (this.grid[row][col].hasBug) {
            this.hitBug(row, col);
            return;
        }

        // Check if reached flower
        if (row === this.flowerPosition.row && col === this.flowerPosition.col) {
            this.reachedFlower();
            return;
        }

        this.renderGrid();
    }

    renderPathLines() {
        const container = document.getElementById('bee-grid');
        if (!container) return;

        // Clear existing lines and dots
        const existingLines = container.querySelectorAll('.path-line, .path-dot');
        existingLines.forEach(line => line.remove());

        if (this.path.length < 1) return; // Allow rendering even with just one cell (the bee)

        // Get actual cell size from CSS
        const cellSize = this.getCellSize();
        const lineWidth = 12; // Increased from 4 to 12 (3x larger)

        // Draw lines between all consecutive cells in the path
        for (let i = 0; i < this.path.length - 1; i++) {
            const current = this.path[i];
            const next = this.path[i + 1];
            
            this.drawPathLine(container, current, next, cellSize, lineWidth);
        }
        
        // If path has reached the flower, ensure there's a visible connection
        if (this.path.length > 0) {
            const lastCell = this.path[this.path.length - 1];
            if (lastCell.row === this.flowerPosition.row && lastCell.col === this.flowerPosition.col) {
                // Add extra visual indicator that we've reached the flower
                this.addFlowerConnectionIndicator(container, lastCell, cellSize, lineWidth);
            }
        }

        // Add dots at path intersections for better continuity
        const gridGap = 2; // CSS gap between cells
        for (let i = 0; i < this.path.length; i++) {
            const pathPos = this.path[i];
            
            const dot = document.createElement('div');
            dot.className = 'path-dot';
            dot.style.position = 'absolute';
            dot.style.left = `${pathPos.col * (cellSize + gridGap) + cellSize / 2 - 6}px`;
            dot.style.top = `${pathPos.row * (cellSize + gridGap) + cellSize / 2 - 6}px`;
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.backgroundColor = '#22c55e';
            dot.style.borderRadius = '50%';
            dot.style.zIndex = '25'; // Even higher z-index to show above everything
            
            // Make the flower dot extra visible
            if (pathPos.row === this.flowerPosition.row && pathPos.col === this.flowerPosition.col) {
                dot.style.width = '16px';
                dot.style.height = '16px';
                dot.style.left = `${pathPos.col * (cellSize + gridGap) + cellSize / 2 - 8}px`;
                dot.style.top = `${pathPos.row * (cellSize + gridGap) + cellSize / 2 - 8}px`;
                dot.style.boxShadow = '0 0 0 2px #ffffff, 0 0 8px #22c55e';
            }
            
            container.appendChild(dot);
        }
    }

    drawPathLine(container, current, next, cellSize, lineWidth) {
        const line = document.createElement('div');
        line.className = 'path-line';
        
        // Calculate positions from cell centers (accounting for grid gaps)
        const gridGap = 2; // CSS gap between cells
        const currentCenterX = current.col * (cellSize + gridGap) + cellSize / 2;
        const currentCenterY = current.row * (cellSize + gridGap) + cellSize / 2;
        const nextCenterX = next.col * (cellSize + gridGap) + cellSize / 2;
        const nextCenterY = next.row * (cellSize + gridGap) + cellSize / 2;

        if (current.row === next.row) {
            // Horizontal line
            const left = Math.min(currentCenterX, nextCenterX);
            const width = Math.abs(nextCenterX - currentCenterX);
            
            line.style.position = 'absolute';
            line.style.left = `${left}px`;
            line.style.top = `${currentCenterY - lineWidth / 2}px`;
            line.style.width = `${width}px`;
            line.style.height = `${lineWidth}px`;
            line.style.backgroundColor = '#22c55e';
            line.style.borderRadius = `${lineWidth / 2}px`;
            line.style.zIndex = '15';
        } else if (current.col === next.col) {
            // Vertical line
            const top = Math.min(currentCenterY, nextCenterY);
            const height = Math.abs(nextCenterY - currentCenterY);
            
            line.style.position = 'absolute';
            line.style.left = `${currentCenterX - lineWidth / 2}px`;
            line.style.top = `${top}px`;
            line.style.width = `${lineWidth}px`;
            line.style.height = `${height}px`;
            line.style.backgroundColor = '#22c55e';
            line.style.borderRadius = `${lineWidth / 2}px`;
            line.style.zIndex = '15';
        }

        container.appendChild(line);
    }

    addFlowerConnectionIndicator(container, flowerCell, cellSize, lineWidth) {
        // Add a cross-pattern on the flower to show clear path connection
        const gridGap = 2;
        const centerX = flowerCell.col * (cellSize + gridGap) + cellSize / 2;
        const centerY = flowerCell.row * (cellSize + gridGap) + cellSize / 2;
        const crossSize = cellSize * 0.6;
        
        // Horizontal cross line
        const hLine = document.createElement('div');
        hLine.className = 'path-line flower-cross';
        hLine.style.position = 'absolute';
        hLine.style.left = `${centerX - crossSize / 2}px`;
        hLine.style.top = `${centerY - lineWidth / 2}px`;
        hLine.style.width = `${crossSize}px`;
        hLine.style.height = `${lineWidth}px`;
        hLine.style.backgroundColor = '#22c55e';
        hLine.style.borderRadius = `${lineWidth / 2}px`;
        hLine.style.zIndex = '30';
        hLine.style.boxShadow = '0 0 8px #22c55e';
        
        // Vertical cross line
        const vLine = document.createElement('div');
        vLine.className = 'path-line flower-cross';
        vLine.style.position = 'absolute';
        vLine.style.left = `${centerX - lineWidth / 2}px`;
        vLine.style.top = `${centerY - crossSize / 2}px`;
        vLine.style.width = `${lineWidth}px`;
        vLine.style.height = `${crossSize}px`;
        vLine.style.backgroundColor = '#22c55e';
        vLine.style.borderRadius = `${lineWidth / 2}px`;
        vLine.style.zIndex = '30';
        vLine.style.boxShadow = '0 0 8px #22c55e';
        
        container.appendChild(hLine);
        container.appendChild(vLine);
    }

    hitBug(row, col) {
        // Show error animation
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('path-error');
            cell.textContent = '🐛';
        }

        // Show simple notification
        this.showSimpleNotification('❌ Wrong! You hit a bug!');

        this.lives--;
        this.gameState = 'failed';
        this.updateStatus();

        setTimeout(() => {
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                // Auto-restart with new random set instead of just retrying
                this.autoRestartAfterBugHit();
            }
        }, 1500); // Slightly longer delay to show the bug
    }

    reachedFlower() {
        this.score += 100 * this.currentSet;
        this.gameState = 'completed';
        this.updateStatus();

        // Show success animation
        const flowerCell = document.querySelector(
            `[data-row="${this.flowerPosition.row}"][data-col="${this.flowerPosition.col}"]`
        );
        if (flowerCell) {
            flowerCell.style.animation = 'pulse 0.5s ease-in-out 3';
        }

        // Show set completion modal
        setTimeout(() => {
            window.logicGamesApp.showSetCompletionModal(this.currentSet, this.maxSets);
        }, 1000);
    }

    nextSet() {
        if (this.currentSet < this.maxSets) {
            this.currentSet++;
            this.generateSet();
            this.renderGrid();
            this.updateStatus();
            this.resetControls();
        } else {
            this.levelCompleted();
        }
    }

    continueToNextSet() {
        if (this.currentSet < this.maxSets) {
            this.nextSet();
            // Auto start the next set with bug flash
            setTimeout(() => {
                this.startSet();
            }, 500); // Small delay to let the grid render
        } else {
            this.levelCompleted();
        }
    }

    levelCompleted() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.startTime) / 1000);

        // Save completion data
        const completionData = {
            level: this.currentLevel,
            score: this.score,
            time: totalTime,
            date: new Date().toDateString()
        };

        window.logicGamesApp.saveGameData(`bee-level-${this.currentLevel}`, completionData);

        // Show success modal
        setTimeout(() => {
            window.logicGamesApp.showModal(
                'Level Complete!',
                `Excellent memory work! You've completed all 5 sets of Level ${this.currentLevel}.`,
                {
                    time: window.logicGamesApp.formatTime(totalTime),
                    moves: this.score.toString() + ' points'
                }
            );
        }, 500);
    }

    retrySet() {
        this.resetPath();
        this.gameState = 'ready';
        this.updateStatus();
        this.resetControls();
    }

    autoRestartAfterBugHit() {
        // Generate a new random set layout
        this.generateSet();
        this.renderGrid();
        this.updateStatus();
        
        // Auto-restart after bug hit
        
        // Auto-start the new set after a brief moment
        setTimeout(() => {
            this.startSet();
        }, 1000);
    }

    gameOver() {
        // Game over state

        setTimeout(() => {
            this.startNewLevel();
        }, 2000);
    }

    resetPath() {
        // Clear path
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].visited = false;
            }
        }

        // Clear any flower styling
        const flowerCell = document.querySelector(`[data-row="${this.flowerPosition.row}"][data-col="${this.flowerPosition.col}"]`);
        if (flowerCell) {
            flowerCell.style.boxShadow = '';
            flowerCell.style.backgroundColor = '';
            flowerCell.style.border = '';
        }

        this.path = [];
        this.pathLines = [];
        this.isDrawing = false;
        this.renderGrid();
    }

    startNewLevel() {
        this.currentLevel = 1;
        this.currentSet = 1;
        this.lives = 3;
        this.score = 0;
        this.generateSet();
        this.renderGrid();
        this.updateStatus();
        this.resetControls();

        // New level started
    }

    showSimpleNotification(message) {
        // Create notification using alert-style but prettier
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        // Add simple fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        if (!document.querySelector('#simple-notification-style')) {
            style.id = 'simple-notification-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }

    resetControls() {
        const startBtn = document.getElementById('bee-start');
        const resetBtn = document.getElementById('bee-reset');
        
        if (startBtn) startBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = true;
    }

    updateStatus() {
        const levelEl = document.getElementById('bee-level');
        const setEl = document.getElementById('bee-set');
        const livesEl = document.getElementById('bee-lives');
        const scoreEl = document.getElementById('bee-score');

        if (levelEl) levelEl.textContent = `Level ${this.currentLevel}`;
        if (setEl) setEl.textContent = `Set ${this.currentSet}/${this.maxSets}`;
        if (livesEl) livesEl.textContent = this.lives;
        if (scoreEl) scoreEl.textContent = this.score;
    }

    getCellSize() {
        // Get the actual cell size from the first cell's computed style
        const container = document.getElementById('bee-grid');
        if (!container) return 80; // fallback to default
        
        const firstCell = container.querySelector('.bee-cell');
        if (!firstCell) return 80; // fallback to default
        
        const computedStyle = window.getComputedStyle(firstCell);
        return parseInt(computedStyle.width);
    }
}
