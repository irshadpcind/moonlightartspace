// Threadline Game Implementation
class ThreadlineGame {
    constructor() {
        this.grid = [];
        this.numbers = [];
        this.path = [];
        this.pathLines = []; // Store visual path lines
        this.currentNumber = 1;
        this.isDrawing = false;
        this.startTime = null;
        this.moves = 0;
        this.solved = false;
        this.score = 0;
        this.difficulty = 'medium'; // easy, medium, hard, expert
        this.hintsUsed = 0;
        this.maxHints = 3;
        this.achievements = [];
        
        // Difficulty configurations - 6x6 grid to allow for walls and variety
        this.difficultyConfig = {
            easy: { gridSize: 6, maxNumber: 5, wallCount: 2, timeBonus: 100 },
            medium: { gridSize: 6, maxNumber: 5, wallCount: 4, timeBonus: 150 },
            hard: { gridSize: 6, maxNumber: 5, wallCount: 6, timeBonus: 200 },
            expert: { gridSize: 6, maxNumber: 5, wallCount: 8, timeBonus: 300 }
        };
        
        // Set initial grid size from difficulty config
        this.gridSize = this.difficultyConfig[this.difficulty].gridSize;
        this.maxNumber = this.difficultyConfig[this.difficulty].maxNumber;
        
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
        // Randomize difficulty for each new puzzle
        this.randomizeDifficulty();
        
        // Get difficulty configuration
        const config = this.difficultyConfig[this.difficulty];
        this.gridSize = config.gridSize;
        this.maxNumber = config.maxNumber;
        
        // Initialize empty grid
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => ({ 
                type: 'empty',
                number: null,
                visited: false,
                wall: false
            }))
        );

        // Use the provided seed for randomization
        const puzzleSeed = seed;
        console.log(`Generating puzzle with difficulty: ${this.difficulty}, gridSize: ${this.gridSize}, seed: ${puzzleSeed}`);
        
        // Generate Hamiltonian path
        const hamiltonianPath = this.generateHamiltonianPath(puzzleSeed);
        console.log(`Generated Hamiltonian path with ${hamiltonianPath ? hamiltonianPath.length : 0} cells`);
        
        // Place numbers along the path
        this.placeNumbers(hamiltonianPath, puzzleSeed);
        
        // Add strategic walls based on difficulty
        this.addStrategicWalls(puzzleSeed, hamiltonianPath);
        
        console.log(`Puzzle generated successfully with ${this.numbers.length} numbers and ${this.difficultyConfig[this.difficulty].wallCount} walls`);

        // Reset game state
        this.path = [];
        this.pathLines = [];
        this.currentNumber = 1;
        this.solved = false;
        this.startTime = Date.now();
        this.moves = 0;
        this.hintsUsed = 0;
        this.score = 1000; // Base score
    }

    generateHamiltonianPath(seed) {
        // Try multiple times to generate a valid Hamiltonian path
        for (let attempt = 0; attempt < 10; attempt++) {
            const path = this.tryGenerateHamiltonianPath(seed + attempt);
            if (path && path.length === this.gridSize * this.gridSize) {
                return path;
            }
        }
        
        // Fallback: generate a simple snake pattern if all attempts fail
        console.log('Hamiltonian path generation failed, using snake pattern');
        return this.generateSnakePath();
    }

    tryGenerateHamiltonianPath(seed) {
        // Start from a random position
        const startRow = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed);
        const startCol = window.logicGamesApp.randomInt(0, this.gridSize - 1, seed);
        
        const path = [];
        const visited = new Set();
        
        // Use recursive backtracking
        if (this.findHamiltonianPath(startRow, startCol, path, visited, seed)) {
            return path;
        }
        
        return null;
    }

    findHamiltonianPath(row, col, path, visited, seed) {
        // Add current cell to path
        path.push({ row, col });
        visited.add(`${row},${col}`);
        
        // If we've visited all cells, we found a complete path
        if (path.length === this.gridSize * this.gridSize) {
            return true;
        }
        
        // Try all possible directions
        const directions = [
            { dr: -1, dc: 0 }, // up
            { dr: 1, dc: 0 },  // down
            { dr: 0, dc: -1 }, // left
            { dr: 0, dc: 1 }   // right
        ];
        
        // Shuffle directions for variety
        const shuffledDirs = window.logicGamesApp.shuffleArray(directions, seed + path.length);
        
        for (const dir of shuffledDirs) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            const key = `${newRow},${newCol}`;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize &&
                !visited.has(key)) {
                
                // Recursively try this path
                if (this.findHamiltonianPath(newRow, newCol, path, visited, seed)) {
                    return true;
                }
            }
        }
        
        // Backtrack: remove current cell from path
        path.pop();
        visited.delete(`${row},${col}`);
        return false;
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

    placeNumbers(hamiltonianPath, seed) {
        // Clear existing numbers
        this.numbers = [];
        
        // Get difficulty configuration
        const config = this.difficultyConfig[this.difficulty];
        const totalCells = hamiltonianPath.length;
        
        // Generate positions for numbers along the path
        const numberPositions = [];
        
        // Always place first number at the start
        numberPositions.push(0);
        
        // Place remaining numbers at intervals along the path
        const interval = Math.floor(totalCells / config.maxNumber);
        for (let i = 1; i < config.maxNumber - 1; i++) {
            const basePos = i * interval;
            // Add some randomness to the position
            const randomOffset = window.logicGamesApp.randomInt(-1, 1, seed + i);
            const pos = Math.max(1, Math.min(totalCells - 2, basePos + randomOffset));
            numberPositions.push(pos);
        }
        
        // Always place last number at the end
        numberPositions.push(totalCells - 1);
        
        // Place the numbers on the grid
        for (let i = 0; i < config.maxNumber; i++) {
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
        
        console.log(`Placed ${this.numbers.length} numbers on the grid`);
    }

    getSeed() {
        // Generate a seed based on current date for daily puzzles
        return window.logicGamesApp ? window.logicGamesApp.getDailyPuzzleSeed() : Date.now();
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
                const cell = this.grid[row][col];
                // Only place walls in cells that are not part of the solution path
                // and are not number cells
                if (!pathSet.has(key) && cell.type === 'empty') {
                    availableCells.push({ row, col });
                }
            }
        }
        
        // If we don't have enough available cells, reduce wall count
        const actualWallCount = Math.min(wallCount, availableCells.length);
        
        // Shuffle and place walls
        const shuffledCells = window.logicGamesApp.shuffleArray(availableCells, seed + 1000);
        let wallsPlaced = 0;
        
        for (const cell of shuffledCells) {
            if (wallsPlaced >= actualWallCount) break;
            
            this.grid[cell.row][cell.col].wall = true;
            this.grid[cell.row][cell.col].type = 'wall';
            wallsPlaced++;
        }
        
        console.log(`Placed ${wallsPlaced} walls out of ${wallCount} requested`);
    }

    renderGrid() {
        const container = document.getElementById('threadline-grid');
        if (!container) {
            console.error('Threadline grid container not found!');
            return;
        }

        console.log(`Rendering grid: ${this.gridSize}x${this.gridSize} with ${this.numbers.length} numbers`);
        
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        let cellCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.createCell(row, col);
                container.appendChild(cell);
                cellCount++;
            }
        }
        
        console.log(`Rendered ${cellCount} cells in ${this.gridSize}x${this.gridSize} grid`);

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
                if (element && element.classList.contains('threadline-cell')) {
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
        const lineWidth = 12; // Increased from 4 to 12 (3x size)

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
            
            // Don't auto-generate new puzzle - let user choose
            // setTimeout(() => {
            //     this.newPuzzle();
            // }, 2000); // Wait 2 seconds after modal shows
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
        try {
            console.log('=== Starting new puzzle generation ===');
            console.log('Current solved state:', this.solved);
            
            // Generate a truly random seed for variety
            const seed = Math.floor(Math.random() * 1000000) + Date.now();
            console.log('Generating new puzzle with seed:', seed);
            
            this.generatePuzzle(seed);
            
            console.log('After generatePuzzle - solved state:', this.solved);
            console.log('Grid size:', this.gridSize, 'Numbers:', this.numbers.length);
            
            this.renderGrid();
            this.updateStatus();
            
            console.log('New puzzle generated successfully');
            console.log('=== New puzzle generation complete ===');
        } catch (error) {
            console.error('Error generating new puzzle:', error);
            // Fallback to daily puzzle if random generation fails
            this.generateDailyPuzzle();
            this.renderGrid();
            this.updateStatus();
        }
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
    randomizeDifficulty() {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const randomIndex = Math.floor(Math.random() * difficulties.length);
        this.difficulty = difficulties[randomIndex];
        console.log(`Random difficulty selected: ${this.difficulty}`);
    }
    
    setDifficulty(difficulty) {
        if (this.difficultyConfig[difficulty]) {
            this.difficulty = difficulty;
            console.log(`Difficulty changed to: ${difficulty}`);
            // Generate new puzzle with current difficulty
            this.newPuzzle();
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
