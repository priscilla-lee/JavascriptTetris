/***************************************************************
* CUSTOMIZABLE VARIABLES
***************************************************************/
var cols = 10; //width
var rows = 20; //height
var unit = 20; //size of block on grid

var key = {
	play: 13, //enter
	left: 37,
	right: 39,
	down: 40,
	rotate: 38, //up
	drop: 32, //space
	hold: 16 //shift
}

var delay = 1; //seconds

var tColor = {
	I: "turquoise",
	J: "blue",
	L: "orange",
	O: "yellow",
	S: "green",
	T: "purple",   
	Z: "red",
	".": "#2A2A2A"
}

/***************************************************************
* GRID
***************************************************************/
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


/***************************************************************
* TETROMINOS
***************************************************************/
function Block(row, col, T) {
	this.r = row;
	this.c = col;
	this.T = T;
	this.equals = function(r,c) {
		return (this.r==r && this.c==c);
	};
	this.canMove = function(dir) {
		if (dir == "down") {return this.r+1 < rows;}
		if (dir == "left") {return this.c-1 >= 0;}
		if (dir == "right") {return this.c+1 < cols;}	
	};
	this.move = function(dir) {
		if (dir == "down") {this.r++;}
		if (dir == "left") {this.c--;}
		if (dir == "right") {this.c++;}
	};
	this.canRotate = function(pivot) {
		var newC = -(this.r - pivot.r) + pivot.c;
		var newR = (this.c - pivot.c) + pivot.r;    
		var validC = (newC >= 0 && newC < cols);
		var validR = (newR >= 0 && newR < rows);
		return validC && validR;
	}; 
	this.rotate = function(pivot) {
		var newC = -(this.r - pivot.r) + pivot.c;
		var newR = (this.c - pivot.c) + pivot.r;    
		this.c = newC;
		this.r = newR;
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

function Tetromino(shape) {
	this.shape = shape;
	this.blocks = getBlocks(shape, this);
	this.contains = function(r,c) {
		for (var b in this.blocks) {
			if (this.blocks[b].equals(r,c)) return true;
		} return false;
	};
	this.canMove = function(dir) {
		for (var b in this.blocks) {
			if (!this.blocks[b].canMove(dir)) return false;
		} return true;
	};
	this.move = function(dir) {
		if (this.canMove(dir)) {
			this.remove();
			for (var b in this.blocks) {
				this.blocks[b].move(dir);
			}
			this.add();
		} else console.log("can't move");
	};
	this.canRotate = function() {
		for (var b in this.blocks) {
			if (!this.blocks[b].canRotate(this.blocks[0] )) return false;
		}
		return true;
	};
	this.rotate = function() {
		if (this.canRotate()) {
			this.remove();
			for (var b in this.blocks) {
				this.blocks[b].rotate( this.blocks[0] ); //first block is pivot
			}
			this.add();
		} else console.log("can't rotate");
	};
	this.add = function() {
		drawTetromino(this);
		var blocks = this.blocks;
		for (var i in blocks) {
			var b = blocks[i];
			grid[b.r][b.c] = this.shape;
		}
	};
	this.remove = function() {
		eraseTetromino(this);
		var blocks = this.blocks;
		for (var i in blocks) {
			var b = blocks[i];
			grid[b.r][b.c] = ".";
		}
	};
}

/***************************************************************
* RENDERING BOARD, SET UP
***************************************************************/
var board = $("#board")[0];
board.height = rows*unit;
board.width = cols*unit;

function drawBlock(row, col, color) {
	var ctx = board.getContext("2d");
	ctx.fillStyle = color;
	ctx.fillRect(col*unit, row*unit, unit, unit);
	ctx.strokeStyle = "black";
	ctx.lineWidth = "2";
	ctx.rect(col*unit, row*unit, unit, unit);
	ctx.stroke();
}

function drawBoard() {
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			drawBlock(r, c, tColor[ grid[r][c] ]);
		}
	}
}

function drawTetromino(tet) {
	//draw new position
	for (var i in tet.blocks) {
		var block = tet.blocks[i];
		drawBlock(block.r, block.c, tColor[tet.shape]);
	} 
}

function eraseTetromino(tet) {
	//remove old position
	for (var i in tet.blocks) {
		var block = tet.blocks[i];
		drawBlock(block.r, block.c, tColor["."]);
	} 
}

/***************************************************************
* KEYBOARD INPUT, DO STUFF
***************************************************************/
var current = new Tetromino("T");
current.add();
drawBoard();

//keyboard input
window.onkeyup = function(e) {
	if (e.keyCode == key.down) {current.move("down");}
	if (e.keyCode == key.left) {current.move("left");}
	if (e.keyCode == key.right) {current.move("right");}
	if (e.keyCode == key.rotate) {current.rotate();}
	if (e.keyCode == key.drop) {
		current = new Tetromino( getRandomShape() );
		current.add();
	}
}

function getRandomShape() {
	var shapes = ["I", "J", "L", "O", "S", "T", "Z"];
	var randInt = Math.floor(Math.random() * shapes.length);
	return shapes[randInt];
}


