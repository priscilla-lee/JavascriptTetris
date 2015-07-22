//vars
var rows = 20,
	cols = 10;
	x = 0;
	y = 0;

//create the grid
for (var r = 0; r < rows; r++) {
	var row = "<tr>";
	for (var c = 0; c < cols; c++) {
		row += "<td id=\"grid" + crID(c,r) + "\" ></td>";
	}
	$("#grid").append(row + "</tr");
}

//create the hold spot
for (var r = 0; r < 4; r++) {
	var row = "<tr>";
	for (var c = 0; c < 4; c++) {
		row += "<td id=\"hold" + crID(c,r) + "\" ></td>";
	}
	$("#hold").append(row + "</tr");
}

//create the next spot
for (var r = 0; r < 4; r++) {
	var row = "<tr>";
	for (var c = 0; c < 4; c++) {
		row += "<td id=\"next" + crID(c,r) + "\" ></td>";
	}
	$("#next").append(row + "</tr");
}

function displayBlock() {
	$("#grid" + xyID(x,y)).css("background-color", "white");
}

function clearGrid() {
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			$("#grid" + crID(c,r)).css("background-color", "black");
		}
	}
}

function clearHold() {
	for (var r = 0; r < 4; r++) {
		for (var c = 0; c < 4; c++) {
			$("#hold" + crID(c,r)).css("background-color", "black");
		}
	}
}

function clearNext() {
	for (var r = 0; r < 4; r++) {
		for (var c = 0; c < 4; c++) {
			$("#next" + crID(c,r)).css("background-color", "black");
		}
	}
}

function crID(c,r) {
	return c + "_" + (rows-1-r);
}

function xyID(x,y) {
	return x + "_" + y;
}

document.onkeydown = function(e) {
	if (e.keyCode == 37) { //left
		if (isValid(x-1,y)) {x--;}
	} else if (e.keyCode == 38) { //up
		if (isValid(x,y+1)) {y++;}
	} else if (e.keyCode == 39) { //right
		if (isValid(x+1,y)) {x++;}
	} else if (e.keyCode == 40) { //down
		if (isValid(x,y-1)) {y--;}
	} else if (e.keyCode == 32) { //space
		
	}
	displayBlock();
};

function isValid(x,y) {
	var xVal = (x >= 0 && x <= 9);
	var yVal = (y >= 0 && y <= 19);
	return xVal && yVal;
}

clearGrid();
clearHold();
clearNext();
displayBlock();




