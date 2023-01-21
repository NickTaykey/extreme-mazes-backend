class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.visited = 0;
  }
  visit(val) {
    this.visited = val;
  }
}

const N_ROWS = 50;
const N_COLS = 50;
const CELL_PADDING = 2;
const CANVAS_SIZE = 400;

const CELL_WIDTH = (CANVAS_SIZE - 2 * CELL_PADDING) / N_COLS;
const CELL_HEIGHT = (CANVAS_SIZE - 2 * CELL_PADDING) / N_ROWS;

const maze_helpers = {
  N_ROWS,
  N_COLS,
  CELL_PADDING,
  CANVAS_SIZE,

  CELL_WIDTH,
  CELL_HEIGHT,

  direction: { top: 0, right: 1, bottom: 2, left: 3 },
  allCells: [],
  wallsHor: [],
  wallsVer: [],
  cells: [],
  stack: [],
  forks: [],
  path: [],

  initializeMaze() {
    for (let i = 0; i < this.N_ROWS; i++) {
      this.cells[i] = [];
      for (let j = 0; j < this.N_COLS; j++) {
        let cell = new Cell(i, j);
        this.cells[i][j] = cell;
        this.allCells.push(cell);
      }
    }
    for (let i = 0; i <= this.N_ROWS; i++) {
      this.wallsHor[i] = [];
      this.wallsVer[i] = [];
      for (let j = 0; j <= this.N_COLS; j++) {
        this.wallsHor[i][j] = 1;
        this.wallsVer[i][j] = 1;
      }
    }
    this.wallsHor[0][0] = 0;
    this.wallsVer[this.N_ROWS - 1][this.N_COLS] = 0;
  },

  buildMaze() {
    this.visitCell(0, 0);
  },

  visitCell(i, j) {
    this.cells[i][j].visit(1);
    let directionsToVisit = this.directionsToVisitInRandomOrder(i, j);
    directionsToVisit.forEach((dir) => {
      let neighbourCell = this.neighbour(i, j, dir);
      if (neighbourCell && neighbourCell.visited === 0) {
        this.removeWallToNeighbour(i, j, dir);
        this.visitCell(neighbourCell.i, neighbourCell.j);
      }
    });
  },

  removeWallToNeighbour(i, j, dir) {
    switch (dir) {
      case this.direction.top:
        this.wallsHor[i][j] = 0;
        break;
      case this.direction.bottom:
        this.wallsHor[i + 1][j] = 0;
        break;
      case this.direction.left:
        this.wallsVer[i][j] = 0;
        break;
      case this.direction.right:
        this.wallsVer[i][j + 1] = 0;
        break;
    }
  },

  neighbour(i, j, dir) {
    switch (dir) {
      case this.direction.top:
        return this.cells[i - 1][j];
      case this.direction.bottom:
        return this.cells[i + 1][j];
      case this.direction.left:
        return this.cells[i][j - 1];
      case this.direction.right:
        return this.cells[i][j + 1];
    }
  },

  directionsToVisitInRandomOrder(i, j) {
    let directions = [];

    if (j > 0) {
      directions.push(this.direction.left);
    }
    if (j < this.N_COLS - 1) {
      directions.push(this.direction.right);
    }
    if (i > 0) {
      directions.push(this.direction.top);
    }
    if (i < this.N_ROWS - 1) {
      directions.push(this.direction.bottom);
    }

    let nDirs = directions.length;
    for (let i = 0; i < nDirs - 1; i++) {
      let k = Math.floor(Math.random() * (nDirs - i));
      let tmp = directions[k];
      directions[k] = directions[i];
      directions[i] = tmp;
    }

    return directions;
  },
};

module.exports = maze_helpers;
