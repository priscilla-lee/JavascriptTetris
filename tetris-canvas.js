/************************************************************************
* WHAT TO WORK ON: bezel, collapse rows bug, prettify/styling, allow rotate
*		at top, wall/floor kicks, fix gameover top death, scorkeeping to 
*		unlock features (themes presets, square image), add music, 2-piece-keeping, levels, 
*		higher points unlock customizatie playing + controls for both hands! gravity
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

var delay = 300; //milliseconds

var scale = {
	board: {
		size: unit, //size of block 
		weight: unit/10, //line weight of block
		outer: 7, mid: 5, inner: 15, ctn: 3 //bezel thicknesses
	},
	hold: {
		outer: 5, mid: 7, inner: 0, ctn: 1
	},
	next: {
		outer: 5, mid: 10, inner: 0, ctn: 1
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
	}
};

var color = {
	I: {outline: "#0D455B", fill: "#1A9AFC", shade: "#1986D3", highlight: "#26ADFF"},
	J: {outline: "#001467", fill: "#133BDF", shade: "#1224C2", highlight: "#245CDF"},
	L: {outline: "#842600", fill: "#F96700", shade: "#D74900", highlight: "#F78400"},
	O: {outline: "#CA9720", fill: "#FFDE23", shade: "#FDB900", highlight: "#FDC500"},
	S: {outline: "#459100", fill: "#7EEB00", shade: "#72D000", highlight: "#8BED00"},
	T: {outline: "#8D1B8A", fill: "#DB2DC4", shade: "#C232A2", highlight: "#E135CD"},
	Z: {outline: "#AF203C", fill: "#F21F48", shade: "#F21F48", highlight: "#F95A83"},
	".": {outline: "black", fill: "#2A2A2A", shade: "#2A2A2A", highlight: "#2A2A2A"},
	"ghost": {outline: "#ccc", fill: "#2A2A2A", shade: "#2A2A2A", highlight: "#2A2A2A"},
};

// var color = {
// 	I: {outline: "black", fill: "turquoise", shade: "turquoise", highlight: "turquoise"},
// 	J: {outline: "black", fill: "blue", shade: "blue", highlight: "blue"},
// 	L: {outline: "black", fill: "orange", shade: "orange", highlight: "orange"},
// 	O: {outline: "black", fill: "yellow", shade: "yellow", highlight: "yellow"},
// 	S: {outline: "black", fill: "green", shade: "green", highlight: "green"},
// 	T: {outline: "black", fill: "purple", shade: "purple", highlight: "purple"},
// 	Z: {outline: "black", fill: "red", shade: "red", highlight: "red"},
// 	".": {outline: "black", fill: "#2A2A2A", shade: "#2A2A2A", highlight: "#2A2A2A"},
// 	"ghost": {outline: "black", fill: "white", shade: "white", highlight: "white"},
// };

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
		for (var r = tallest; r < rows; r++) {
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
		board_draw.block(this.r, this.c, this.T.shape);
	};
	this.erase = function() {
		board_draw.block(this.r, this.c, ".");
	};
}

function TBlocks(shape, T) {
	//center, top position
	var mid = Math.floor(cols/2)-1; //integer division, truncates
	var shift = mid-1; //shifted for 4-wide or 3-wide tetrominos
	var i=shift, j=shift, l=shift, s=shift, t=shift, z=shift, o=mid;

	switch(shape) {
		case 'I': return [new Block(0,i+1,T), new Block(0,i+0,T), new Block(0,i+2,T), new Block(0,i+3,T)];
		case 'J': return [new Block(1,j+1,T), new Block(0,j+0,T), new Block(1,j+0,T), new Block(1,j+2,T)];
		case 'L': return [new Block(1,l+1,T), new Block(0,l+2,T), new Block(1,l+0,T), new Block(1,l+2,T)];
		case 'O': return [new Block(0,o+0,T), new Block(0,o+1,T), new Block(1,o+0,T), new Block(1,o+1,T)];
		case 'S': return [new Block(0,s+1,T), new Block(0,s+2,T), new Block(1,s+0,T), new Block(1,s+1,T)];
		case 'T': return [new Block(1,t+1,T), new Block(0,t+1,T), new Block(1,t+0,T), new Block(1,t+2,T)];
		case 'Z': return [new Block(0,z+1,T), new Block(0,z+0,T), new Block(1,z+1,T), new Block(1,z+2,T)];
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
	this.resetPosition = function() {
		this.blocks = new TBlocks(shape, this);
	};
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
		for (var i in this.ghostBlocks) {
			var g = this.ghostBlocks[i]
			board_draw.block(g.r, g.c, "."); 
		}
	};
	this.drawGhost = function() {
		this.calcGhost();
		for (var i in this.ghostBlocks) {
			var g = this.ghostBlocks[i];
			board_draw.block(g.r, g.c, "ghost");
		}
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
Draw = {
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
	square: function(loc, scal, x, y, shape) {
		var size = scale[scal].size;
		var weight = scale[scal].weight;

		var otln = color[shape].outline;
		var fill = color[shape].fill;
		var shd = color[shape].shade;
		var hlgt = color[shape].highlight;

		//outer rectangle
		this.rect(loc, x, y, size, size, weight, fill, otln);
		//inner rectangle
		this.rect(loc, x+(size/4), y+(size/4), size/2, size/2, weight, shd, hlgt);
	},
	squareImage: function(loc, img, x, y, w, h) {
	    var ctx = loc.getContext("2d");
	   		ctx.drawImage(img,10,10,10,10);
	},
	circle: function(loc, x, y, r, fill, line) {
		var ctx = loc.getContext("2d");
			ctx.beginPath();
			ctx.fillStyle = fill;
			ctx.strokeStyle = line;
			ctx.arc(x, y, r, 0, 2*Math.PI);
			ctr.fill();
			ctx.stroke();
	},
	box: function(loc, scal, x, y) {
		var size = scale[scal].box;
		var weight = scale[scal].weight;
		var fill = color["."].fill;
		this.rect(loc, x, y, size, size, weight, fill, "black");
	},
	roundRect: function(loc, x, y, w, h, r, color) {
		var ctx= loc.getContext("2d");
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.strokeStyle = color;
			//draw rounded rectangle
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + r);
			ctx.lineTo(x + w, y + h - r);
			ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			ctx.lineTo(x + r, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.closePath();
			//stroke & fill	
			ctx.fill();    
			ctx.stroke();  
	},
	bezel: function(loc) {
		var w = loc.width;
		var h = loc.height;

		var otr = scale[loc.id].outer;
		var mid = scale[loc.id].mid + otr;
		var inr = scale[loc.id].inner + mid;

		this.roundRect(loc, 0, 0, w, h, 10, "#666"); //outer
		this.roundRect(loc, otr, otr, w-(otr*2), h-(otr*2), 8, "#fafafa"); //mid
		this.roundRect(loc, mid, mid, w-(mid*2), h-(mid*2), 6, "#ddd"); //inner
		this.roundRect(loc, inr, inr, w-(inr*2), h-(inr*2), 4, "#000"); //container
	}
};

function Board_Draw() {
	var b = scale.board;
	b.x = b.outer + b.mid + b.inner + b.ctn;
	b.y = b.outer + b.mid + b.inner + b.ctn;

	board.height = rows*b.size + 2*(b.y);
	board.width =  cols*b.size + 2*(b.x);

	this.block = function(r, c, shape) {
		var size = scale.board.size;
		Draw.square(board, "board", c*size+b.x, r*size+b.y, shape);
	};
	this.all = function() {
		Draw.bezel(board);
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) 
				this.block(r, c, grid[r][c]);
		}
	};
}

function Hold_Draw() {
	var box = scale["box_md"].box;

	var h = scale.hold;
	h.x = h.outer + h.mid + h.inner + h.ctn;
	h.y = h.outer + h.mid + h.inner + h.ctn;

	hold.height = box + 2*(h.y);
	hold.width = box + 2*(h.x);

	this.all = function() {
		Draw.bezel(hold);
		if (game.held) {
			var box_draw = new Box_Draw(hold, "box_md", h.x+0, h.y+0, game.held.shape);
			box_draw.box();			
		} else {
			var box_draw = new Box_Draw(hold, "box_md", h.x+0, h.y+0, ".");
			box_draw.empty();
		}
	};
}

function Next_Draw() {
	var box = scale["box_md"].box;

	var n = scale.next;
	n.x = n.outer + n.mid + n.inner + n.ctn;
	n.y = n.outer + n.mid + n.inner + n.ctn;

	next.height = box*5 + 2*(n.y);
	next.width = box + 2*(n.x);

	this.array = game.randomPieces.list; 
	this.all = function() {
		Draw.bezel(next);
		this.array = game.randomPieces.list; //update
		for (var i = 0; i < 5; i++) {
			var shape = this.array[i];
			var box_draw = new Box_Draw(next, "box_md", n.x+0, n.y+box*i, shape);
			box_draw.box();
		}
	};

}

function Box_Draw(loc, scal, x, y, shape) {
	this.dimensions = { 
		I: {w: 4, h: 1}, J: {w: 3, h: 2}, L: {w: 3, h: 2}, O: {w: 2, h: 2}, 
		S: {w: 3, h: 2}, T: {w: 3, h: 2}, Z: {w: 3, h: 2}
	};
	this.box = function() {
		this.empty();
		this.shape();
	};
	this.empty = function() {
		Draw.box(loc, scal, x, y);
	};
	this.shape = function() {
		var ctr = this.getCenterCoord();
		var coords = this.getShapeCoords();
		for (var i in coords)
			Draw.square(loc, scal, coords[i].X, coords[i].Y, shape);
	};
	this.getCenterCoord = function() {
		var dim = this.dimensions[shape];
		var box = scale[scal].box;
		var size = scale[scal].size;

		var xCenter = x + (box - size*dim.w)/2; //depends on width
		var yCenter = y + (box - size*dim.h)/2; //depends on height

		return {X: xCenter, Y: yCenter};

	};
	this.getShapeCoords = function() {
		var s = scale[scal].size;
		var ctr = this.getCenterCoord();
		var x = ctr.X, y = ctr.Y;
		switch (shape) {
			case 'I': return [{X:x, Y:y}, {X:x+s, Y:y}, {X:x+(2*s), Y:y}, {X:x+(3*s), Y:y}];
			case 'J': return [{X:x, Y:y}, {X:x, Y:y+s}, {X:x+s, Y:y+s}, {X:x+(2*s), Y:y+s}];
			case 'L': return [{X:x, Y:y+s}, {X:x+s, Y:y+s}, {X:x+(2*s), Y:y+s}, {X:x+(2*s), Y:y}];
			case 'O': return [{X:x, Y:y}, {X:x+s, Y:y}, {X:x+s, Y:y+s}, {X:x, Y:y+s}];
			case 'S': return [{X:x, Y:y+s}, {X:x+s, Y:y+s}, {X:x+s, Y:y}, {X:x+(2*s), Y:y}];
			case 'T': return [{X:x+s, Y:y}, {X:x, Y:y+s}, {X:x+s, Y:y+s}, {X:x+(2*s), Y:y+s}];
			case 'Z': return [{X:x, Y:y}, {X:x+s, Y:y}, {X:x+s, Y:y+s}, {X:x+(2*s), Y:y+s}];
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
	this.limitHold = false;
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
		self.current.drawGhost();
		self.current.draw();
		if (!self.current.fall()) self.nextPiece();	
		next_draw.all();
	};	
	this.nextPiece = function() {
		var next = this.randomPieces.next();
		this.current = new Tetromino(next);
		this.current.add(); this.current.draw();
		this.limitHold = false;
		grid.collapseFullRows();
		this.current.drawGhost();
		this.current.draw();
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
		//limit hold swaps
		if (this.limitHold) return; 
		else this.limitHold = true;

		if (this.held) {
			//remmove & erase current
			this.current.remove(); 
			this.current.erase();
			//add & draw held
			this.held.resetPosition();
			this.held.add(); 
			this.held.resetGhost(); 
			this.held.draw();
			//swap
			var temp = this.held; 
			this.held = this.current;
			this.current = temp;
		} else {
			//erase current & put in hold
			this.current.remove(); this.current.erase();
			this.held = this.current;
			//draw from next list
			var next = this.randomPieces.next();
			this.current = new Tetromino(next);
			this.current.add(); this.current.draw();
		}
	};
	this.keyPressed = function() {
		next_draw.all();
		hold_draw.all(); 
		this.current.drawGhost();
		this.current.draw();
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