const express = require('express');
const router = express.Router();

// Create new maze
router.post('/', function (req, res, next) {});

// Setup web socket connection for broadcasting player position updates
router.get('/:id', function (req, res, next) {
  res.json({ message: 'W Web Sockets' });
});

module.exports = router;
