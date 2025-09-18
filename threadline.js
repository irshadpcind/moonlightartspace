// Threadline Game Implementation
class ThreadlineGame {
    constructor() {
        this.grid = [];
        this.gridSize = 7; // 7x7 grid
        this.numbers = [];
        this.path = [];
        this.pathLines = []; // Store visual path lines
        this.currentNumber = 1;
        this.maxNumber = 9;
        this.isDrawing = false;
        this.startTime = null;
        this.moves = 0;
        this.solved = false;
        this.score = 0;
        this.difficulty = 'medium'; // easy, medium, hard, expert
        this.hintsUsed = 0;
        this.maxHints = 3;
        this.achievements = [];
        
        // Difficulty configurations - simplified to 5x5 with 1-5 numbers
        this.difficultyConfig = {
            easy: { gridSize: 5, maxNumber: 5, wallCount: 2, timeBonus: 100 },
            medium: { gridSize: 5, maxNumber: 5, wallCount: 3, timeBonus: 150 },
            hard: { gridSize: 5, maxNumber: 5, wallCount: 4, timeBonus: 200 },
            expert: { gridSize: 5, maxNumber: 5, wallCount: 5, timeBonus: 300 }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateDailyPuzzle();
        this.renderGrid();
        this.updateStatus();
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('threadline-reset')?.addEventListener('click', () => {
            this.resetPath();
        });

        document.getElementById('threadline-hint')?.addEventListener('click', () => {
            this.showHint();
        });


        document.getElementById('threadline-new')?.addEventListener('click', () => {
            this.newPuzzle();
        });

        // Difficulty selector
        document.getElementById('difficulty-select')?.addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });

        // Global mouse events for better drag experience
        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.showHint();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetPath();
                        break;
                }
            }
        });
    }

    generateDailyPuzzle() {
        const seed = window.logicGamesApp.getDailyPuzzleSeed();
        this.generatePuzzle(seed);
    }

    generatePuzzle(seed = Date.now()) {
        // Get difficulty configuration
        const config = this.difficultyConfig[this.difficulty];
        this.gridSize = config.gridSize;
        this.maxNumber = config.maxNumber;
        
        // Generate Hamiltonian path (visits every cell exactly once)
        const hamiltonianPath = this.generateHamiltonianPath(seed);
        
        // Initialize empty grid
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => ({ 
                type: 'empty', 
                number: null, 
                visited: false,
                wall: false
            }))
        );

        // Place exactly 5 numbers (1-5) at strategic positions along the path
        this.numbers = [];
        
        // Calculate positions for numbers 1-5
        const totalCells = hamiltonianPath.length;
        const numberPositions = [];
        
        // Position 1: Start of path
        numberPositions.push(0);
        
        // Position 2: Around 25% through the path
        numberPositions.push(Math.floor(totalCells * 0.25));
        
        // Position 3: Around 50% through the path
        numberPositions.push(Math.floor(totalCells * 0.5));
        
        // Position 4: Around 75% through the path
        numberPositions.push(Math.floor(totalCells * 0.75));
        
        // Position 5: End of path
        numberPositions.push(totalCells - 1);
        
        // Place the numbers
        for (let i = 0; i < this.maxNumber; i++) {
            const posIndex = numberPositions[i];
            const pos = hamiltonianPath[posIndex];
            
            this.grid[pos.row][pos.col] = {
                type: 'number',
                number: i + 1,
                visited: false,
                wall: false
            };
            this.numbers.push({ number: i + 1, row: pos.row, col: pos.col });
        }

        // Add walls strategically (not blocking the path)
        this.addStrategicWalls(seed, hamiltonianPath);

        // Reset game state
        this.path = [];
        this.pathLines = [];
        this.currentNumber = 1;
        this.solved = false;
        this.startTime = Date.now();
        this.moves = 0;
        this.hintsUsed = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.score = 0;
    }

    generateHamiltonianPath(seed) {
        // Use a simplified Hamiltonian path generator for 5x5 grid
        const path = [];
        const visited = new Set();
        
        // Start from a random position
        const startRow = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed);
        const startCol = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed);
        
        // Use backtracking to find a Hamiltonian path
        const stack = [{ row: startRow, col: startCol, path: [{ row: startRow, col: startCol }] }];
        
        while (stack.length > 0) {
            const current = stack.pop();
            const { row, col, path: currentPath } = current;
            
            if (currentPath.length === this.gridSize * this.gridSize) {
                return currentPath; // Found complete Hamiltonian path
            }
            
            // Try all possible directions
            const directions = [
                { dr: -1, dc: 0 }, // up
                { dr: 1, dc: 0 },  // down
                { dr: 0, dc: -1 }, // left
                { dr: 0, dc: 1 }   // right
            ];
            
            // Shuffle directions for variety
            const shuffledDirs = window.logicGamesApp.shuffleArray(directions, seed + currentPath.length);
            
            for (const dir of shuffledDirs) {
                const newRow = row + dir.dr;
                const newCol = col + dir.dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize &&
                    !visited.has(key)) {
                    
                    visited.add(key);
                    stack.push({
                        row: newRow,
                        col: newCol,
                        path: [...currentPath, { row: newRow, col: newCol }]
                    });
                }
            }
        }
        
        // Fallback: generate a simple snake pattern if Hamiltonian path fails
        return this.generateSnakePath();
    }

    generateSnakePath() {
        const path = [];
        let direction = 1; // 1 for right, -1 for left
        let row = 0;
        
        for (let i = 0; i < this.gridSize; i++) {
            if (direction === 1) {
                // Go right
                for (let col = 0; col < this.gridSize; col++) {
                    path.push({ row: i, col: col });
                }
            } else {
                // Go left
                for (let col = this.gridSize - 1; col >= 0; col--) {
                    path.push({ row: i, col: col });
                }
            }
            direction *= -1; // Reverse direction
        }
        
        return path;
    }

    addStrategicWalls(seed, hamiltonianPath) {
        const config = this.difficultyConfig[this.difficulty];
        const wallCount = config.wallCount;
        
        // Create a set of path positions for quick lookup
        const pathSet = new Set();
        for (const pos of hamiltonianPath) {
            pathSet.add(`${pos.row},${pos.col}`);
        }
        
        // Find cells that are not on the path and not numbers
        const availableCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const key = `${row},${col}`;
                if (!pathSet.has(key) && this.grid[row][col].type === 'empty') {
                    availableCells.push({ row, col });
                }
            }
        }
        
        // Shuffle and place walls
        const shuffledCells = window.logicGamesApp.shuffleArray(availableCells, seed + 1000);
        let wallsPlaced = 0;
        
        for (const cell of shuffledCells) {
            if (wallsPlaced >= wallCount) break;
            
            this.grid[cell.row][cell.col].wall = true;
            this.grid[cell.row][cell.col].type = 'wall';
            wallsPlaced++;
        }
    }

    renderGrid() {
        const container = document.getElementById('threadline-grid');
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
        cell.className = 'threadline-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const gridCell = this.grid[row][col];

        // Set cell type and content
        if (gridCell.type === 'number') {
            cell.classList.add('number');
            cell.textContent = gridCell.number.toString();
        } else if (gridCell.type === 'wall') {
            cell.classList.add('wall');
        }

        // Set visited state
        if (gridCell.visited) {
            cell.classList.add('visited');
        }

        // Highlight current target
        if (gridCell.type === 'number' && gridCell.number === this.currentNumber) {
            cell.classList.add('current');
        }

        // Add event listeners with improved handling
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

        // Touch events for mobile
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleCellMouseDown(e, row, col);
        });

        cell.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.classList.contains('threadline-cell')) {
                    const touchRow = parseInt(element.dataset.row);
                    const touchCol = parseInt(element.dataset.col);
                    this.handleCellMouseEnter(e, touchRow, touchCol);
                }
            }
        });

        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDrawing = false;
        });

        // Prevent context menu
        cell.addEventListener('contextmenu', (e) => e.preventDefault());

        return cell;
    }

    handleCellMouseDown(e, row, col) {
        if (this.solved) return;

        const gridCell = this.grid[row][col];
        
        // Start drawing from number 1 or continue from last position
        if (this.canStartDrawing(row, col)) {
            this.isDrawing = true;
            this.startDrawing(row, col);
        }
    }

    handleCellMouseEnter(e, row, col) {
        if (!this.isDrawing || this.solved) return;
        this.continueDrawing(row, col);
    }

    handleCellMouseUp(e, row, col) {
        this.isDrawing = false;
    }

    canStartDrawing(row, col) {
        const gridCell = this.grid[row][col];
        
        // Can start from number 1
        if (gridCell.type === 'number' && gridCell.number === 1 && this.path.length === 0) {
            return true;
        }

        // Can continue from last position in path
        if (this.path.length > 0) {
            const lastPos = this.path[this.path.length - 1];
            return lastPos.row === row && lastPos.col === col;
        }

        return false;
    }

    startDrawing(row, col) {
        if (this.path.length === 0) {
            // Starting from number 1
            this.addToPath(row, col);
        }
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

        // Unmark as visited (except for numbers)
        const removedCell = this.grid[removedPos.row][removedPos.col];
        if (removedCell.type !== 'number') {
            removedCell.visited = false;
        } else {
            // If removing a number, update current target
            this.currentNumber = removedCell.number;
        }

        this.moves++;
        this.updateStatus();
        this.renderGrid();
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    isValidMove(row, col) {
        const gridCell = this.grid[row][col];
        
        // Can't move to walls
        if (gridCell.wall) return false;

        // Can't revisit cells (except numbers)
        if (gridCell.visited && gridCell.type !== 'number') return false;

        // If it's a number, must be the next expected number
        if (gridCell.type === 'number') {
            return gridCell.number === this.currentNumber;
        }

        return true;
    }

    addToPath(row, col) {
        const gridCell = this.grid[row][col];
        
        // Save state for undo
        
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
        
        // Mark as visited
        this.grid[row][col].visited = true;
        
        // If it's a number, update current target
        if (gridCell.type === 'number') {
            this.currentNumber = gridCell.number + 1;
            // Bonus points for finding numbers in sequence
            this.score += 50;
        } else {
            // Points for each move
            this.score += 10;
        }

        this.moves++;
        this.updateStatus();
        this.renderGrid();
        
        // Check if puzzle is solved
        this.checkSolution();
    }

    renderPathLines() {
        const container = document.getElementById('threadline-grid');
        if (!container) return;

        // Clear existing lines
        const existingLines = container.querySelectorAll('.path-line');
        existingLines.forEach(line => line.remove());

        if (this.path.length < 2) return;

        // Get actual cell size from CSS
        const cellSize = this.getCellSize();
        const lineWidth = 4;

        for (let i = 0; i < this.path.length - 1; i++) {
            const current = this.path[i];
            const next = this.path[i + 1];
            
            const currentRow = current.row;
            const currentCol = current.col;
            const nextRow = next.row;
            const nextCol = next.col;

            const line = document.createElement('div');
            line.className = 'path-line';
            
            // Calculate positions from cell centers (accounting for grid gaps)
            const gridGap = 2; // CSS gap between cells
            const currentCenterX = currentCol * (cellSize + gridGap) + cellSize / 2;
            const currentCenterY = currentRow * (cellSize + gridGap) + cellSize / 2;
            const nextCenterX = nextCol * (cellSize + gridGap) + cellSize / 2;
            const nextCenterY = nextRow * (cellSize + gridGap) + cellSize / 2;

            if (currentRow === nextRow) {
                // Horizontal line
                const left = Math.min(currentCenterX, nextCenterX);
                const width = Math.abs(nextCenterX - currentCenterX);
                
                line.style.position = 'absolute';
                line.style.left = `${left}px`;
                line.style.top = `${currentCenterY - lineWidth / 2}px`;
                line.style.width = `${width}px`;
                line.style.height = `${lineWidth}px`;
                line.style.backgroundColor = '#6366f1';
                line.style.borderRadius = `${lineWidth / 2}px`;
                line.style.zIndex = '10';
            } else if (currentCol === nextCol) {
                // Vertical line
                const top = Math.min(currentCenterY, nextCenterY);
                const height = Math.abs(nextCenterY - currentCenterY);
                
                line.style.position = 'absolute';
                line.style.left = `${currentCenterX - lineWidth / 2}px`;
                line.style.top = `${top}px`;
                line.style.width = `${lineWidth}px`;
                line.style.height = `${height}px`;
                line.style.backgroundColor = '#6366f1';
                line.style.borderRadius = `${lineWidth / 2}px`;
                line.style.zIndex = '10';
            }

            container.appendChild(line);
        }

        // Add dots at path intersections for better continuity
        const gridGap = 2; // CSS gap between cells
        for (let i = 0; i < this.path.length; i++) {
            const cellIndex = this.path[i];
            const row = cellIndex.row;
            const col = cellIndex.col;
            
            const dot = document.createElement('div');
            dot.className = 'path-dot';
            dot.style.position = 'absolute';
            dot.style.left = `${col * (cellSize + gridGap) + cellSize / 2 - 3}px`;
            dot.style.top = `${row * (cellSize + gridGap) + cellSize / 2 - 3}px`;
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.backgroundColor = '#6366f1';
            dot.style.borderRadius = '50%';
            dot.style.zIndex = '15';
            
            container.appendChild(dot);
        }
    }

    checkSolution() {
        // Must have visited all numbers in order
        const visitedNumbers = this.numbers.filter(num => 
            this.grid[num.row][num.col].visited
        ).length;

        if (visitedNumbers !== this.maxNumber) return;

        // Must have visited all empty cells
        const totalEmptyCells = this.getTotalEmptyCells();
        const visitedEmptyCells = this.getVisitedEmptyCells();

        if (visitedEmptyCells === totalEmptyCells) {
            this.solved = true;
            this.onPuzzleSolved();
        }
    }

    getTotalEmptyCells() {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].type === 'empty') {
                    count++;
                }
            }
        }
        return count;
    }

    getVisitedEmptyCells() {
        let count = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.type === 'empty' && cell.visited) {
                    count++;
                }
            }
        }
        return count;
    }

    onPuzzleSolved() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.startTime) / 1000);
        
        // Calculate final score
        const config = this.difficultyConfig[this.difficulty];
        const timeBonus = Math.max(0, config.timeBonus - totalTime * 2);
        const efficiencyBonus = Math.max(0, 100 - this.moves);
        const hintPenalty = this.hintsUsed * 25;
        
        this.score += timeBonus + efficiencyBonus - hintPenalty;
        this.score = Math.max(0, this.score);
        
        // Check for achievements
        const newAchievements = this.checkAchievements();
        
        // Save completion data
        const completionData = {
            date: new Date().toDateString(),
            time: totalTime,
            moves: this.moves,
            score: this.score,
            difficulty: this.difficulty,
            hintsUsed: this.hintsUsed,
            achievements: this.achievements
        };
        
        window.logicGamesApp.saveGameData('threadline-daily', completionData);

        // Show success modal with enhanced stats
        setTimeout(() => {
            window.logicGamesApp.showModal(
                'Threadline Solved!',
                `Excellent work! You've successfully connected all numbers and filled every cell.${newAchievements.length > 0 ? ' New achievements unlocked!' : ''}`,
                {
                    time: window.logicGamesApp.formatTime(totalTime),
                    moves: `${this.moves} moves`,
                    score: `${this.score} points`,
                    difficulty: this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)
                }
            );
            
            // Generate new random level after showing completion
            setTimeout(() => {
                this.newPuzzle();
            }, 2000); // Wait 2 seconds after modal shows
        }, 500);
    }

    resetPath() {
        // Reset all visited states except numbers
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].type !== 'number') {
                    this.grid[row][col].visited = false;
                } else {
                    // Reset number visited states too
                    this.grid[row][col].visited = false;
                }
            }
        }

        this.path = [];
        this.pathLines = [];
        this.currentNumber = 1;
        this.solved = false;
        this.moves = 0;
        this.startTime = Date.now();

        this.updateStatus();
        this.renderGrid();
    }

    showHint() {
        if (this.solved) return;

        // Find the current target number
        const targetNumber = this.numbers.find(num => num.number === this.currentNumber);
        if (!targetNumber) return;

        // Highlight the target briefly
        const targetCell = document.querySelector(
            `[data-row="${targetNumber.row}"][data-col="${targetNumber.col}"]`
        );
        
        if (targetCell) {
            targetCell.style.animation = 'pulse 0.5s ease-in-out 3';
            setTimeout(() => {
                targetCell.style.animation = '';
            }, 1500);
        }
    }

    newPuzzle() {
        // Generate a truly random seed for variety
        const seed = Math.floor(Math.random() * 1000000) + Date.now();
        this.generatePuzzle(seed);
        this.renderGrid();
        this.updateStatus();
    }

    updateStatus() {
        const currentNumberEl = document.getElementById('current-number');
        const cellsRemainingEl = document.getElementById('cells-remaining');

        if (currentNumberEl) {
            currentNumberEl.textContent = this.currentNumber <= this.maxNumber ? 
                this.currentNumber : 'Complete';
        }

        if (cellsRemainingEl) {
            const totalCells = this.getTotalEmptyCells() + this.maxNumber;
            const visitedCells = this.getVisitedEmptyCells() + 
                this.numbers.filter(num => this.grid[num.row][num.col].visited).length;
            cellsRemainingEl.textContent = Math.max(0, totalCells - visitedCells);
        }

        // Update score display if it exists
        const scoreEl = document.getElementById('threadline-score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }

        // Update hints display if it exists
        const hintsEl = document.getElementById('threadline-hints');
        if (hintsEl) {
            hintsEl.textContent = `${this.maxHints - this.hintsUsed}`;
        }
    }

    getCellSize() {
        // Get the actual cell size from the first cell's computed style
        const container = document.getElementById('threadline-grid');
        if (!container) return 70; // fallback to default
        
        const firstCell = container.querySelector('.threadline-cell');
        if (!firstCell) return 70; // fallback to default
        
        const computedStyle = window.getComputedStyle(firstCell);
        return parseInt(computedStyle.width);
    }


    // Difficulty management
    setDifficulty(difficulty) {
        if (this.difficultyConfig[difficulty]) {
            this.difficulty = difficulty;
            this.generatePuzzle();
            this.renderGrid();
            this.updateStatus();
        }
    }

    // Enhanced hint system
    showHint() {
        if (this.solved || this.hintsUsed >= this.maxHints) return;

        this.hintsUsed++;
        this.score = Math.max(0, this.score - 25); // Penalty for using hints

        // Find the current target number
        const targetNumber = this.numbers.find(num => num.number === this.currentNumber);
        if (!targetNumber) return;

        // Highlight the target briefly
        const targetCell = document.querySelector(
            `[data-row="${targetNumber.row}"][data-col="${targetNumber.col}"]`
        );
        
        if (targetCell) {
            targetCell.style.animation = 'pulse 0.5s ease-in-out 3';
            setTimeout(() => {
                targetCell.style.animation = '';
            }, 1500);
        }

        this.updateStatus();
    }

    // Achievement system
    checkAchievements() {
        const newAchievements = [];
        
        // Speed achievements
        if (this.moves <= 20 && !this.achievements.includes('speed_demon')) {
            newAchievements.push('speed_demon');
        }
        
        // Perfect score achievements
        if (this.hintsUsed === 0 && !this.achievements.includes('no_hints')) {
            newAchievements.push('no_hints');
        }
        
        // Difficulty achievements
        if (this.difficulty === 'expert' && !this.achievements.includes('expert_solver')) {
            newAchievements.push('expert_solver');
        }
        
        this.achievements.push(...newAchievements);
        return newAchievements;
    }

}

// Initialize global mouse listeners when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Add global mouse event listeners for better drawing experience
    let isDrawing = false;
    
    document.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    document.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
});
