/************************************************************************
* GOALS: wall kicks, floor kicks, ghost shadow, instant drop, next view,
		 hold view, AI, blocks falling through cracks, scorekeeping,
		 higher points/levels unlock customization features (styles,
		 themes, presets, square image input, grid size, speed, shapes,
		 level editors?)
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

function isValidEmpty(row, col) {
	var valR = row >= 0 && row < rows;
	var valC = col >= 0 && col < cols;
	return valR && valC && (grid[row][col] == ".");
}

/************************************************************************
* BLOCK: stores row, col, parent Tetromino, also contains methods
		 equals, canMove, move, canRotate, rotate, draw, & erase
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
		return (this.T.contains(newR, newC) || isValidEmpty(newR, newC));
	};
	this.move = function(dir) {
		if (dir == "down") {this.r++;}
		if (dir == "left") {this.c--;}
		if (dir == "right") {this.c++;}
	};
	this.canRotate = function(pivot) {
		var newR = (this.c - pivot.c) + pivot.r;    
		var newC = -(this.r - pivot.r) + pivot.c;		
		return (this.T.contains(newR, newC) || isValidEmpty(newR, newC));
	}; 
	this.rotate = function(pivot) {
		var newC = -(this.r - pivot.r) + pivot.c;
		var newR = (this.c - pivot.c) + pivot.r;    
		this.c = newC;
		this.r = newR;
	}; 
	this.jump = function(row, col) {
		this.r = row;
		this.c = col;
	};
	this.draw = function(isGhost) {
		drawBlock(this.r, this.c, color[T.shape], isGhost);
	};
	this.erase = function() {
		drawBlock(this.r, this.c, color["."], false);
	};
}

function getBlocks(shape, T) {
	switch(shape) {
		case 'I': return [new Block(0,0,T), new Block(0,1,T), new Block(0,2,T), new Block(0,3,T)];
		case 'J': return [new Block(0,0,T), new Block(1,0,T), new Block(1,1,T), new Block(1,2,T)];
		case 'L': return [new Block(0,2,T), new Block(1,0,T), new Block(1,1,T), new Block(1,2,T)];
		case 'O': return [new Block(0,0,T), new Block(0,1,T), new Block(1,0,T), new Block(1,1,T)];
		case 'S': return [new Block(0,1,T), new Block(0,2,T), new Block(1,0,T), new Block(1,1,T)];
		case 'T': return [new Block(0,1,T), new Block(1,0,T), new Block(1,1,T), new Block(1,2,T)];
		case 'Z': return [new Block(0,0,T), new Block(0,1,T), new Block(1,1,T), new Block(1,2,T)];
	}
}

/************************************************************************
* TETROMINO: stores shape, an array of blocks, and methods
			 contains, canMove, move, canRotate, rotate, add, & remove
************************************************************************/
function Tetromino(shape, ghost) {
	this.shape = shape;
	this.blocks = getBlocks(shape, this);
	this.isGhost = ghost;
	this.contains = function(r,c) {
		for (var i in this.blocks) {
			if (this.blocks[i].equals(r,c)) return true;
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
			if (!this.blocks[b].canRotate(this.blocks[0])) return false;
		} return true;
	};
	this.rotate = function() {
		if (this.canRotate()) {
			this.remove(); 
			for (var b in this.blocks) this.blocks[b].rotate(this.blocks[0]); //first block is pivot
			this.add();
		} else console.log("can't rotate");
	};
	this.add = function() {
		for (var i in this.blocks) {
			var b = this.blocks[i];
			grid[b.r][b.c] = this.shape;
			b.draw(this.isGhost);
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
		// if (this.canMove("down")) {
		// 	this.move("down");
		// 	return true;
		// } else return false;
	};
	this.drop = function() {};
	this.ghost = function() {
		var ghost = this.clone();
		while(ghost.fall()) {}
		//while(ghost.canMove("down")) ghost.fall();
		return ghost;
	};
	this.clone = function() { //deep copy
		var clone = new Tetromino(this.shape, true);
		clone.blocks = []; //make a copy of blocks
		for (var i in this.blocks) {
			var oldB = this.blocks[i];
			var newB = new Block(oldB.r, oldB.c, clone);
			clone.blocks.push(newB);
		}
		return clone;
	};
}

/************************************************************************
* RENDERING: set board canvas w x h, drawBlock, drawBoard
************************************************************************/
var board = $("#board")[0];
board.height = rows*unit;
board.width = cols*unit;

function drawBlock(row, col, color, isGhost) {
	var ctx = board.getContext("2d");
	if (isGhost) {
		ctx.fillStyle = "black";
		ctx.strokeStyle = "white";
	} else {
		ctx.fillStyle = color;
		ctx.strokeStyle = "black";
	} ctx.fillRect(col*unit, row*unit, unit, unit);
	ctx.lineWidth = "2";
	ctx.rect(col*unit, row*unit, unit, unit);
	ctx.stroke();
}

function drawBoard() {
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			drawBlock(r, c, color[grid[r][c]], false);
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
	if (e.keyCode == key.drop) {current.ghost();}
	if (e.keyCode == key.play || e.keyCode == key.pause) {
		if (playing) pause();
		else play();
	} 
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
}

function newShape() {
	current = new Tetromino(getRandomShape(), false);
	current.add();
}