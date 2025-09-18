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

        // Global mouse events for better drag experience
        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });
    }

    generateDailyPuzzle() {
        const seed = window.logicGamesApp.getDailyPuzzleSeed();
        this.generatePuzzle(seed);
    }

    generatePuzzle(seed = Date.now()) {
        // Initialize empty grid
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => ({ 
                type: 'empty', 
                number: null, 
                visited: false,
                wall: false
            }))
        );

        // Generate number positions using seed
        this.numbers = [];
        const positions = [];
        
        // Create all possible positions
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                positions.push({ row, col });
            }
        }

        // Shuffle positions with seed
        const shuffledPositions = window.logicGamesApp.shuffleArray(positions, seed);
        
        // Place numbers 1-9
        for (let i = 1; i <= this.maxNumber; i++) {
            const pos = shuffledPositions[i - 1];
            this.grid[pos.row][pos.col] = {
                type: 'number',
                number: i,
                visited: false,
                wall: false
            };
            this.numbers.push({ number: i, row: pos.row, col: pos.col });
        }

        // Add some walls to make it challenging
        const wallCount = window.logicGamesApp.randomInt(3, 6, seed + 100);
        for (let i = 0; i < wallCount; i++) {
            const pos = shuffledPositions[this.maxNumber + i];
            if (this.grid[pos.row][pos.col].type === 'empty') {
                this.grid[pos.row][pos.col].wall = true;
                this.grid[pos.row][pos.col].type = 'wall';
            }
        }

        // Reset game state
        this.path = [];
        this.pathLines = [];
        this.currentNumber = 1;
        this.solved = false;
        this.startTime = Date.now();
        this.moves = 0;
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

        const cellSize = 60;
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
            
            // Calculate positions from cell centers
            const currentCenterX = currentCol * cellSize + cellSize / 2;
            const currentCenterY = currentRow * cellSize + cellSize / 2;
            const nextCenterX = nextCol * cellSize + cellSize / 2;
            const nextCenterY = nextRow * cellSize + cellSize / 2;

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
        for (let i = 0; i < this.path.length; i++) {
            const cellIndex = this.path[i];
            const row = cellIndex.row;
            const col = cellIndex.col;
            
            const dot = document.createElement('div');
            dot.className = 'path-dot';
            dot.style.position = 'absolute';
            dot.style.left = `${col * cellSize + cellSize / 2 - 3}px`;
            dot.style.top = `${row * cellSize + cellSize / 2 - 3}px`;
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
        
        // Save completion data
        const completionData = {
            date: new Date().toDateString(),
            time: totalTime,
            moves: this.moves
        };
        
        window.logicGamesApp.saveGameData('threadline-daily', completionData);

        // Show success modal
        setTimeout(() => {
            window.logicGamesApp.showModal(
                'Threadline Solved!',
                'Excellent work! You\'ve successfully connected all numbers and filled every cell.',
                {
                    time: window.logicGamesApp.formatTime(totalTime),
                    moves: this.moves.toString()
                }
            );
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
        const seed = Date.now() + Math.random() * 1000;
        this.generatePuzzle(Math.floor(seed));
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
