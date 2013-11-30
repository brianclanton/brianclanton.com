musicmaze.maze = (function() {
	// Variable initialization (for my own sanity)
	var settings = musicmaze.settings;
	var length, width, cells;

	// Move stack
	var moves = {
		head : [],
		isEmpty : function() {
			return this.head.length == 0;
		},
		push : function(value) {
			this.head.push(value);
		},
		pop : function() {
			var poppedValue = null;

			if (!this.isEmpty()) {
				poppedValue = this.head[this.head.length - 1];
				this.head.splice(this.head.length - 1);
			}

			return poppedValue;
		}
	};

	// Functions
	function initialize() {
		length = settings.length;
		width = settings.width;

		cells = [];

		for (var i = 0; i < length; i++) {
			cells[i] = [];
			for (var j = 0; j < width; j++)
				cells[i][j] = createCell();
		}

		// console.log("in maze init: ", length, width, settings);

		generateMaze(createLocation(0, 0));
		// console.log(cells);
	}

	function generateMaze() {
		var totalCells = length * width;
		var currentLocation = createLocation(0, 0);
		var numCellsVisited = 1;

		do {
			var neighbors = getNeighbors(currentLocation);
			// console.log("currentLocation", currentLocation, moves);

			// Check if we have neighbors
			if (neighbors.length != 0) {
				// Choose a random neighbor
				var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
				
				// Remove wall between current cell and neighbor
				removeWall(currentLocation, randomNeighbor);

				// Push current cell to stack
				moves.push(currentLocation);

				// Update current cell
				currentLocation = randomNeighbor;

				// Increment number of visited cells
				numCellsVisited++;
			} else {
				// Pop stack and make current cell
				// console.log("popping stack");
				currentLocation = moves.pop();
			}
		} while (numCellsVisited < totalCells);
	}

	// function getNumberVisited() {
	// 	var count = 0;

	// 	for (var i = 0; i < length; i++)
	// 		for (var j = 0; j < width; j++)
	// 			if (cells[i][j].visited)
	// 				count++;

	// 	return count;
	// }

	// function markVisited(loc) {
	// 	getCellAt(loc).visited = true;
	// }

	function getNeighbors(loc) {
		var neighbors = [];
	
		neighbors.push(createLocation(loc.x - 1, loc.y));
		neighbors.push(createLocation(loc.x + 1, loc.y));
		neighbors.push(createLocation(loc.x, loc.y - 1));
		neighbors.push(createLocation(loc.x, loc.y + 1));

		return neighbors.filter(function(n) {
			return isValid(n) && getCellAt(n).isUnvisited();
		});
	}

	function removeWall(a, b) {
		// console.log(a, b);
		// Left wall check
		if (b.x + 1 == a.x) {
			getCellAt(a).leftWall = false;
			getCellAt(b).rightWall = false;
			// console.log("left wall");
		}
		// Right wall check
		else if (b.x - 1 == a.x) {
			getCellAt(a).rightWall = false;
			getCellAt(b).leftWall = false;
			// console.log("right wall");
		}
		// Top wall check
		else if (b.y + 1 == a.y) {
			getCellAt(a).topWall = false;
			getCellAt(b).bottomWall = false;
			// console.log("top wall");
		}
		// Bottom wall check
		else if (b.y - 1 == a.y) {
			getCellAt(a).bottomWall = false;
			getCellAt(b).topWall = false;
			// console.log("bottom wall");
		}
	}

	function getCellAt(loc) {
		return cells[loc.x][loc.y];
	}

	function createCell() {
		return {
			rightWall : true,
			leftWall : true,
			bottomWall : true,
			topWall : true,
			walls : [],
			heightOffset : 0,
			isUnvisited : function() {
				return this.rightWall && this.leftWall && this.topWall && this.bottomWall;
			}
		}
	}

	function createLocation(x, y) {
		return {
			x : x,
			y : y
		};
	}

	function isValid(loc) {
		return loc.x >= 0 && loc.x < width && loc.y >= 0 && loc.y < length;
	}

	// Make selected functions public
	return {
		initialize : initialize,
		getWidth : function() { return settings.width; },
		getLength : function() { return settings.length; },
		getCellAt : function(x, y) {
			return getCellAt(createLocation(x, y));
		}
	};
})();