/************************************************************************
* GOALS: wall kicks, floor kicks, ghost shadow, instant drop, next view,
*		 hold view, AI, blocks falling through cracks, scorekeeping,
*		 higher points/levels unlock customization features (styles,
*		 themes, presets, square image input, grid size, speed, shapes,
*		 level editors?), 2 pieces at a time!! with controls for both hands!!!
* WHAT TO WORK ON: random tetris piece generator (7bag method) 
************************************************************************/

/************************************************************************
* CUSTOMIZABLE VARIABLES: cols, rows, size, keys, delay, colors
************************************************************************/
var cols = 10; //width
var rows = 20; //height
var unit = 20; //size of block on grid

var key = {
	play: 13, //enter
	pause: 13, //enter
	left: 37,
	right: 39,
	down: 40,
	rotate: 38, //up
	drop: 32, //space
	hold: 16 //shift
}

var delay = 500; //milliseconds

var color = {
	I: "turquoise",
	J: "blue",
	L: "orange",
	O: "yellow",
	S: "green",
	T: "purple",   
	Z: "red",
	".": "#2A2A2A"
}

/************************************************************************
* GRID: 2d array, valid & empty checking
************************************************************************/
function get2DArray(rows, cols) {
	var array = {};
	for (var r = 0; r < rows; r++) {
		var oneRow = {};
		for (var c = 0; c < cols; c++) {oneRow[c] = "."}
		array[r] = oneRow;
	}
	return array;
}

var grid = get2DArray(rows, cols);

grid.isValidEmpty = function(row, col) {return this.isValid(row, col) && this.isEmpty(row, col);};
grid.isEmpty = function(row, col) {return grid[row][col] == ".";};
grid.isValid = function(row, col) {return this.isValidRow(row) && this.isValidCol(col);};
grid.isValidCol = function(col) {return (col >= 0 && col < cols);};
grid.isValidRow = function(row) {return (row >= 0 && row < rows);};

grid.isEmptyRow = function(row) {
	for (var col = 0; col < cols; col++) {
		if (grid[row][col] != ".") return false;
	} return true;
};

grid.isFullRow = function(row) {
	for (var col = 0; col < cols; col++) {
		if (grid[row][col] == ".") return false;
	} return true;
};

grid.clearRow = function(row) {
	for (var c = 0; c < cols; c++) 
		grid[row][c] = ".";
};

grid.collapseRow = function(row) {
	var tallest = this.tallestDirtyRow();
	while (row > tallest) {
		this.shiftRowFromTo(row-1, row);
		row--;
	} this.clearRow(row); //clear the top row that got shifted down
	drawBoard(); 
};

grid.collapseFullRows = function() {
	var tallest = this.tallestDirtyRow();
	for (var r = rows-1; r >= tallest; r--) {
		if (this.isFullRow(r)) this.collapseRow(r);
	}
};

grid.shiftRowFromTo = function(from, to) {
	for (var c = 0; c < cols; c++) 
		grid[to][c] = grid[from][c];
};

grid.isDirtyRow = function(row) { //"dirty" = contains blocks
	return !this.isEmptyRow(row);
};

grid.tallestDirtyRow = function() {
	var r = rows-1;
	while (this.isDirtyRow(r)) r--;
	return r+1;
};

grid.numDirtyRows = function() {
	var tallest = this.tallestDirtyRow();
	return rows-tallest; //# of "dirty" rows
};

/************************************************************************
* BLOCK: stores row, col, parent Tetromino, also contains methods
*		 equals, canMove, move, canRotate, rotate, draw, & erase
************************************************************************/
function Block(row, col, T) {
	this.r = row;
	this.c = col;
	this.T = T;
	this.equals = function(r,c) {
		return (this.r==r && this.c==c);
	};
	this.canMove = function(dir) {
		var newR = this.r;
		var newC = this.c;
		if (dir == "down") {newR = this.r+1;}
		if (dir == "left") {newC = this.c-1;}
		if (dir == "right") {newC = this.c+1;}	
		return (this.T.contains(newR, newC) || grid.isValidEmpty(newR, newC));
	};
	this.move = function(dir) {
		if (dir == "down") {this.r++;}
		if (dir == "left") {this.c--;}
		if (dir == "right") {this.c++;}
	};
	this.canRotate = function() {
		if (this.T.shape == "O") return true; //squares don't rotate
		var pivot = this.T.blocks[0]; //first block is pivot
		var newR = (this.c - pivot.c) + pivot.r;    
		var newC = -(this.r - pivot.r) + pivot.c;		
		return (this.T.contains(newR, newC) || grid.isValidEmpty(newR, newC));
	}; 
	this.rotate = function() {
		if (this.T.shape == "O") return; //squares don't rotate
		var pivot = this.T.blocks[0]; //first block is pivot
		var newC = -(this.r - pivot.r) + pivot.c;
		var newR = (this.c - pivot.c) + pivot.r;    
		this.c = newC;
		this.r = newR;
	}; 
	this.draw = function() {
		drawBlock(this.r, this.c, color[T.shape]);
	};
	this.erase = function() {
		drawBlock(this.r, this.c, color["."]);
	};
}

function getBlocks(shape, T) {
	switch(shape) {
		case 'I': return [new Block(0,1,T), new Block(0,0,T), new Block(0,2,T), new Block(0,3,T)];
		case 'J': return [new Block(1,1,T), new Block(0,0,T), new Block(1,0,T), new Block(1,2,T)];
		case 'L': return [new Block(1,1,T), new Block(0,2,T), new Block(1,0,T), new Block(1,2,T)];
		case 'O': return [new Block(0,0,T), new Block(0,1,T), new Block(1,0,T), new Block(1,1,T)];
		case 'S': return [new Block(0,1,T), new Block(0,2,T), new Block(1,0,T), new Block(1,1,T)];
		case 'T': return [new Block(1,1,T), new Block(0,1,T), new Block(1,0,T), new Block(1,2,T)];
		case 'Z': return [new Block(0,1,T), new Block(0,0,T), new Block(1,1,T), new Block(1,2,T)];
		case 'ghost': return [new Block(-1,-1,T), new Block(-1,-1,T), new Block(-1,-1,T), new Block(-1,-1,T)];
	}
}

/************************************************************************
* TETROMINO: stores shape, an array of blocks, and methods
*			 contains, canMove, move, canRotate, rotate, add, & remove
************************************************************************/
function Tetromino(shape) {
	this.shape = shape;
	this.blocks = getBlocks(shape, this);
	this.ghostBlocks = getBlocks("ghost", this);
	this.contains = function(r,c) {
		for (var i in this.blocks) {
			var inBlocks = this.blocks[i].equals(r,c);
			var inGhost = this.ghostBlocks[i].equals(r,c);
			if (inBlocks || inGhost) return true;
		} return false;
	};
	this.canMove = function(dir) {
		for (var i in this.blocks) {
			if (!this.blocks[i].canMove(dir)) return false;
		} return true;
	};
	this.move = function(dir) {
		if (this.canMove(dir)) {
			this.remove(); 
			for (var i in this.blocks) this.blocks[i].move(dir);
			this.add();
			return true;
		} else console.log("can't move " + dir);
		return false;
	};
	this.canRotate = function() {
		for (var b in this.blocks) {
			if (!this.blocks[b].canRotate()) return false;
		} return true;
	};
	this.rotate = function() {
		if (this.canRotate()) {
			this.remove(); 
			for (var b in this.blocks) this.blocks[b].rotate();
			this.add();
		} else console.log("can't rotate");
	};
	this.add = function() {
		this.ghost();
		for (var i in this.blocks) {
			var b = this.blocks[i];
			grid[b.r][b.c] = this.shape;
			b.draw();
		} 
	};
	this.remove = function() {
		for (var i in this.blocks) {
			var b = this.blocks[i];
			grid[b.r][b.c] = ".";
			b.erase();
		}
	};
	this.fall = function() {
		return this.move("down");
	};
	this.drop = function() {
		while(this.fall());
		newShape();
	};
	this.ghost = function() {
		for (var i in this.ghostBlocks) { //erase old blocks
			var b = this.ghostBlocks[i];
			drawBlock(b.r, b.c, color["."]);
		}
		var blocks = []; //make deep copy of blocks
		for (var i in this.blocks) {
			var b = this.blocks[i];
			blocks.push(new Block(b.r, b.c, this));
		}
		var canFall = true;
		while (canFall) { //hard drop
			for (var i in blocks) { //if all can fall, make all fall
				if (!blocks[i].canMove("down")) 
					canFall = false;
			} if (canFall) for (var i in blocks) blocks[i].r++; 				
		}
		//draw
		for (var i in blocks) drawBlock(blocks[i].r, blocks[i].c, "white");
		this.ghostBlocks = blocks; //update ghostBlocks
	};
}

/************************************************************************
* RENDERING: set board canvas w x h, drawBlock, drawBoard
************************************************************************/
var board = $("#board")[0];
board.height = rows*unit;
board.width = cols*unit;

function drawBlock(row, col, fill) {
	var ctx = board.getContext("2d");
	ctx.beginPath();
	ctx.fillStyle = fill;
	ctx.strokeStyle = "black";
	ctx.fillRect(col*unit, row*unit, unit, unit);
	ctx.lineWidth = "2";
	ctx.rect(col*unit, row*unit, unit, unit);
	ctx.stroke();
}

function drawBoard() {
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			drawBlock(r, c, color[grid[r][c]]);
		}
	}
}

/************************************************************************
* KEY INPUT: also randomShape generation
************************************************************************/
window.onkeydown = function(e) {
	if (e.keyCode == key.down) {current.move("down");}
	if (e.keyCode == key.left) {current.move("left");}
	if (e.keyCode == key.right) {current.move("right");}
	if (e.keyCode == key.rotate) {current.rotate();}
	if (e.keyCode == key.drop) {current.drop();}
	if (e.keyCode == key.hold) {current.ghost();}
	if (e.keyCode == key.play || e.keyCode == key.pause) {
		if (playing) pause();
		else play();
	} grid.collapseFullRows(); //anytime key is pressed
}

function getRandomShape() {
	var shapes = ["I", "J", "L", "O", "S", "T", "Z"];
	var randInt = Math.floor(Math.random() * shapes.length);
	return shapes[randInt];
}

/************************************************************************
* GAME LOGIC: game loop and play
************************************************************************/
drawBoard();
newShape();

var loop;
var playing = false;

function play() {
	loop = setInterval(gameStep, delay);
	playing = true;
}

function pause() {
	clearInterval(loop);
	playing = false;
}

function gameStep() {
	if (!current.fall()) newShape();
	grid.collapseFullRows();
}

function newShape() {
	current = new Tetromino(getRandomShape());
	current.add();
}