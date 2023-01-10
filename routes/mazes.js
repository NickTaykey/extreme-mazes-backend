const { ref, set } = require('firebase/database');
const express = require('express');
const router = express.Router();

const maze_helpers = require('../maze_helpers');

// Create new maze
router.get('/', async function (req, res, next) {
  maze_helpers.initializeMaze();
  maze_helpers.buildMaze();

  const id = Date.now();

  await set(ref(res.locals.db, `mazes/${id}`), {
    JSONmaze: JSON.stringify(maze_helpers),
    players: [],
  });

  return res.status(201).json({ id, JSONmaze: maze_helpers });
});

// Setup web socket connection for broadcasting player position updates
router.get('/:id', function (req, res, next) {
  res.json({ message: 'W Web Sockets' });
});

module.exports = router;
