/************************************************************************
* WHAT TO WORK ON: piece should enter in middle of grid, 
*		fix gameover top death, allow rotate at top,
*		prettify, wall/floor kicks, score-keeping, levels, 
*		higher points unlock customization features (styles, themes, presets, 
*		square image), add music, 2-piece playing + controls for both hands! gravity
*		fine-tuning? fix speed when arrow keys are held down, and then "AI" fun
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

var style = {
	board: {
		size: unit, //size of block 
		weight: unit/10 //line weight of block
	},
	box_lg: {
		size: unit*0.8,
		weight: unit/10*0.8,
		box: unit*0.9*4 //size of containing box
	},
	box_md: {
		size: unit*0.7,
		weight: unit/10*0.7,
		box: unit*0.8*4
	},
	box_sm: {
		size: unit*0.6,
		weight: unit/10*0.6,
		box: unit*0.7*4
	},
	color: {I: "turquoise", J: "blue", L: "orange", O: "yellow", 
			S: "green", T: "purple", Z: "red", ".": "#2A2A2A", "ghost": "white"}
};

/************************************************************************
* GRID: 2d array, valid & empty checking
************************************************************************/
function Grid() {
	for (var r = 0; r < rows; r++) {
		var oneRow = {};
		for (var c = 0; c < cols; c++) {oneRow[c] = "."}
		this[r] = oneRow;
	} //creates the 2d array

	this.isValidEmpty = function(row, col) {return this.isValid(row, col) && this.isEmpty(row, col);};
	this.isEmpty = function(row, col) {return this[row][col] == ".";};
	this.isValid = function(row, col) {return this.isValidRow(row) && this.isValidCol(col);};
	this.isValidCol = function(col) {return (col >= 0 && col < cols);};
	this.isValidRow = function(row) {return (row >= 0 && row < rows);};
	this.isEmptyRow = function(row) {
		for (var col = 0; col < cols; col++) {
			if (this[row][col] != ".") return false;
		} return true;
	};
	this.isFullRow = function(row) {
		for (var col = 0; col < cols; col++) {
			if (this[row][col] == ".") return false;
		} return true;
	};
	this.clearRow = function(row) {
		for (var c = 0; c < cols; c++) 
			this[row][c] = ".";
	};
	this.collapseRow = function(row) {
		var tallest = this.tallestDirtyRow();
		while (row > tallest) {
			this.shiftRowFromTo(row-1, row);
			row--;
		} this.clearRow(row); //clear the top row that got shifted down
		board_draw.all(); 
	};
	this.collapseFullRows = function() {
		var tallest = this.tallestDirtyRow();
		for (var r = rows-1; r >= tallest; r--) {
			if (this.isFullRow(r)) this.collapseRow(r);
		}
	};
	this.shiftRowFromTo = function(from, to) {
		for (var c = 0; c < cols; c++) 
			this[to][c] = this[from][c];
	};
	this.isDirtyRow = function(row) { //"dirty" = contains blocks
		return !this.isEmptyRow(row);
	};
	this.tallestDirtyRow = function() {
		var r = rows-1;
		while (this.isDirtyRow(r)) r--;
		return r+1;
	};
	this.numDirtyRows = function() {
		var tallest = this.tallestDirtyRow();
		return rows-tallest; //# of "dirty" rows
	};
}

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
		board_draw.tetBlock(this);
	};
	this.erase = function() {
		board_draw.emptyBlock(this);
	};
}

function TBlocks(shape, T) {
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
	this.blocks = new TBlocks(shape, this);
	this.ghostBlocks = new TBlocks("ghost", this);
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
			this.remove(); this.erase();
			for (var i in this.blocks) this.blocks[i].move(dir);
			this.add(); this.draw();
			return true;
		} //else console.log("can't move " + dir);
		return false;
	};
	this.canRotate = function() {
		for (var b in this.blocks) {
			if (!this.blocks[b].canRotate()) return false;
		} return true;
	};
	this.rotate = function() {
		if (this.canRotate()) {
			this.remove(); this.erase();
			for (var b in this.blocks) this.blocks[b].rotate();
			this.add(); this.draw();
		} //else console.log("can't rotate");
	};
	this.add = function() {
		for (var i in this.blocks) {
			var b = this.blocks[i];
			grid[b.r][b.c] = this.shape;
		} 
	};
	this.remove = function() {
		for (var i in this.blocks) {
			var b = this.blocks[i];
			grid[b.r][b.c] = ".";
		}
	};
	this.draw = function() {
		this.drawGhost();
		for (var i in this.blocks) this.blocks[i].draw();
	};
	this.erase = function() {
		for (var i in this.blocks) this.blocks[i].erase();
		this.eraseGhost();
	};
	this.fall = function() {
		return this.move("down");
	};
	this.drop = function() {
		while(this.fall());
	};
	this.eraseGhost = function() {
		this.calcGhost();
		for (var i in this.ghostBlocks) 
			board_draw.emptyBlock(this.ghostBlocks[i]); 
	};
	this.drawGhost = function() {
		this.calcGhost();
		for (var i in this.ghostBlocks) 
			board_draw.ghostBlock(this.ghostBlocks[i]);
	};
	this.resetGhost = function() {
		this.ghostBlocks = new TBlocks("ghost", this);
	};
	this.calcGhost = function() {
		var ghost = []; //make deep copy of blocks
		for (var i in this.blocks) { 
			var b = this.blocks[i];
			ghost.push(new Block(b.r, b.c, this));
		} 
		outer: while (true) { //hard drop
			for (var i in ghost) //if all can fall, make all fall
				if (!ghost[i].canMove("down")) break outer; 
			for (var i in ghost) ghost[i].r++; 				
		} 
		this.ghostBlocks = ghost; //update ghostBlocks
	};
}

/************************************************************************
* RANDOM PIECE GENERATOR: 7 bag method
************************************************************************/
function RandomPieces() {
	this.bag = new Bag();
	this.list = this.bag.batch();
	this.next = function() {
		if (this.list.length < 7 ) //maintain 7 random pieces
			this.list.push(this.bag.select());
		var next = this.list.shift(); //removes first and shifts everything down
		return next;
	};
}

function Bag() {
	this.pieces = ["I", "J", "L", "O", "S", "T", "Z"];
	this.select = function() {
		if (this.pieces.length == 0) this.replenish();
		var randomIndex = Math.floor(Math.random() * this.pieces.length);
		var selected = this.pieces[randomIndex];
		this.pieces.splice(randomIndex, 1);
		return selected;
	};
	this.replenish = function() {
		this.pieces = ["I", "J", "L", "O", "S", "T", "Z"];
	};
	this.batch = function() { //returns an array (a "batch") of 7 pieces
		var batch = [];
		for (var i = 0; i < 7; i++) 
			batch.push(this.select());
		return batch;
	};
}

/************************************************************************
* DRAW: (rendering) set board canvas w x h, draw block & board
************************************************************************/
var Draw = {
	rect: function(loc, x, y, w, h, weight, fill, line) {
		var ctx= loc.getContext("2d");
		ctx.beginPath();
		ctx.fillStyle = fill;
		ctx.strokeStyle = line;
		ctx.fillRect(x, y, w, h);
		ctx.lineWidth = weight;
		ctx.rect(x, y, w, h);
		ctx.stroke();
	},
	square: function(loc, styl, x, y, fill, line) {
		var size = style[styl].size;
		var weight = style[styl].weight;
		this.rect(loc, x, y, size, size, weight, fill, line);
	},
	box: function(loc, styl, x, y) {
		var size = style[styl].box;
		var weight = style[styl].weight;
		var fill = style.color["."];
		this.rect(loc, x, y, size, size, weight, fill, "black");
	}
};

function Board_Draw() {
	board.height = rows*style.board.size;
	board.width = cols*style.board.size;

	this.block = function(r, c, type) {
		var size = style.board.size;
		Draw.square(board, "board", c*size, r*size, style.color[type], "black");
	};
	this.tetBlock = function(block) {
		this.block(block.r, block.c, block.T.shape);
	};
	this.emptyBlock = function(block) {
		this.block(block.r, block.c, ".");
	};
	this.ghostBlock = function(block) {
		this.block(block.r, block.c, "ghost");
	};
	this.all = function() {
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) 
				this.block(r, c, grid[r][c]);
		}
	};
}

function Hold_Draw() {
	var box = style["box_md"].box;
	hold.height = box;
	hold.width = box;

	this.all = function() {
		if (game.held) {
			var box_draw = new Box_Draw(hold, "box_md", 0, 0, game.held.shape);
			box_draw.box();			
		} else {
			var box_draw = new Box_Draw(hold, "box_md", 0, 0, ".");
			box_draw.empty();
		}
	};
}

function Next_Draw() {
	var box = style["box_md"].box;
	next.height = box*5;
	next.width = box;

	this.array = game.randomPieces.list; 
	this.all = function() {
		this.array = game.randomPieces.list; //update
		for (var i = 0; i < 5; i++) {
			var shape = this.array[i];
			var box_draw = new Box_Draw(next, "box_md", 0, box*i, shape);
			box_draw.box();
		}
	};

}

function Box_Draw(loc, styl, x, y, shape) {
	this.dimensions = { 
		I: {w: 4, h: 1}, J: {w: 3, h: 2}, L: {w: 3, h: 2}, O: {w: 2, h: 2}, 
		S: {w: 3, h: 2}, T: {w: 3, h: 2}, Z: {w: 3, h: 2}
	};
	this.box = function() {
		this.empty();
		this.shape();
	};
	this.empty = function() {
		Draw.box(loc, styl, x, y);
	};
	this.shape = function() {
		var ctr = this.getCenterCoord();
		var coords = this.getShapeCoords();
		for (var i in coords)
			Draw.square(loc, styl, coords[i].X, coords[i].Y, style.color[shape], "black");
	};
	this.getCenterCoord = function() {
		var dim = this.dimensions[shape];
		var box = style[styl].box;
		var size = style[styl].size;

		var xCenter = x + (box - size*dim.w)/2; //depends on width
		var yCenter = y + (box - size*dim.h)/2; //depends on height

		return {X: xCenter, Y: yCenter};

	};
	this.getShapeCoords = function() {
		var size = style[styl].size;
		var ctr = this.getCenterCoord();
		var x = ctr.X, y = ctr.Y;
		switch (shape) {
			case 'I': return [{X:x, Y:y}, {X:x+size, Y:y}, {X:x+(2*size), Y:y}, {X:x+(3*size), Y:y}];
			case 'J': return [{X:x, Y:y}, {X:x, Y:y+size}, {X:x+size, Y:y+size}, {X:x+(2*size), Y:y+size}];
			case 'L': return [{X:x, Y:y+size}, {X:x+size, Y:y+size}, {X:x+(2*size), Y:y+size}, {X:x+(2*size), Y:y}];
			case 'O': return [{X:x, Y:y}, {X:x+size, Y:y}, {X:x+size, Y:y+size}, {X:x, Y:y+size}];
			case 'S': return [{X:x, Y:y+size}, {X:x+size, Y:y+size}, {X:x+size, Y:y}, {X:x+(2*size), Y:y}];
			case 'T': return [{X:x+size, Y:y}, {X:x, Y:y+size}, {X:x+size, Y:y+size}, {X:x+(2*size), Y:y+size}];
			case 'Z': return [{X:x, Y:y}, {X:x+size, Y:y}, {X:x+size, Y:y+size}, {X:x+(2*size), Y:y+size}];
		}
	};
}

/************************************************************************
* GAME: game logic, loop, start, play, pause, etc
************************************************************************/
function Game() {
	var self = this;
	this.started = false;
	this.loop = null;
	this.playing = false;
	this.randomPieces = new RandomPieces();
	this.current;
	this.held;
	this.start = function() {
		this.started = true;
		this.nextPiece();
		this.play();
	};
	this.play = function() {
		this.loop = setInterval(this.step, delay);
		this.playing = true;
	};
	this.pause = function() {
		clearInterval(this.loop);
		this.playing = false;
	};
	this.step = function() {
		if (!self.current.fall()) self.nextPiece(); //randomPieces.next();
		grid.collapseFullRows();
		next_draw.all();
	};	
	this.nextPiece = function() {
		var next = this.randomPieces.next();
		this.current = new Tetromino(next);
		this.current.add(); this.current.draw();
	};
	this.move = function(dir) {
		this.current.move(dir);
	};
	this.rotate = function() {
		this.current.rotate();
	};
	this.drop = function() {
		this.current.drop();
		this.nextPiece();
	};
	this.hold = function() {
		if (this.held) { //then swap the two
			this.current.remove(); this.current.erase(); //erase current
			this.held.add(); this.held.resetGhost(); this.held.draw(); //draw held
			var temp = this.held; 
			this.held = this.current;
			this.current = temp;
		} else { //then stick current into hold & draw from next
			this.current.remove(); this.current.erase(); //erase current
			this.held = this.current; //put in hold box
			this.nextPiece();
		}
	};
	this.keyPressed = function() {
		next_draw.all();
		hold_draw.all();
		grid.collapseFullRows(); 
	};
}

/************************************************************************
* KEYBOARD INPUT: onkeydown
************************************************************************/
window.onkeydown = function(e) {
	if (!game.started) {game.start(); return;} //any key to start game
	if (e.keyCode == key.play || e.keyCode == key.pause) {
		if (game.playing) game.pause();
		else game.play();
	} //toggle play & pause
	if (game.playing) { //only listen to keys if game is playing
		if (e.keyCode == key.down) {game.move("down");}
		if (e.keyCode == key.left) {game.move("left");}
		if (e.keyCode == key.right) {game.move("right");}
		if (e.keyCode == key.rotate) {game.rotate();}
		if (e.keyCode == key.drop) {game.drop();}
		if (e.keyCode == key.hold) {game.hold();}
		game.keyPressed(); //anytime key is pressed
	}
};

/************************************************************************
* SET UP THE GAME: create necessary game variables & draw
************************************************************************/
var grid = new Grid();
var game = new Game();
var board_draw = new Board_Draw();
var next_draw = new Next_Draw();
var hold_draw = new Hold_Draw();

board_draw.all();
next_draw.all();
hold_draw.all();