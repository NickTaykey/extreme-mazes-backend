const { ref, set, push, get } = require('firebase/database');
const express = require('express');
const db = require('../firebase');
const router = express.Router();
const app = express();

const maze_helpers = require('../maze_helpers');

const genRandomHEXColor = () => {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
};

// Create new maze
router.post('/', async function (req, res, next) {
  maze_helpers.initializeMaze();
  maze_helpers.buildMaze();

  const id = Date.now();

  await set(ref(db, `mazes/${id}`), {
    JSONmaze: JSON.stringify(maze_helpers),
    playersList: [],
  });

  return res.status(201).json({ id, JSONmaze: maze_helpers });
});

// Setup web socket connection for broadcasting player position updates

const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});

io.on('connection', function (socket) {
  console.log('A user connected');

  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });

  socket.on('add-player', async ({ mazeId }) => {
    const baseRefPath = `mazes/${mazeId}`;

    const { CELL_WIDTH, CELL_HEIGHT } = maze_helpers;

    await push(ref(db, `${baseRefPath}/playersList`), {
      lastPosition: [CELL_WIDTH * 0.5, CELL_HEIGHT * 0.5],
      color: genRandomHEXColor(),
    });

    const { JSONmaze, playersList } = (await get(ref(db, baseRefPath))).val();
    const currentPlayerId = Object.keys(playersList).at(-1);

    io.sockets.sockets.get(socket.id).emit('players-state-transmition', {
      currentPlayerId,
      playersList,
      JSONmaze,
    });

    socket.emit('update-board-state', playersList);
  });

  socket.on('board-state-update-request', async (mazeId) => {
    const gameRef = ref(db, `mazes/${mazeId}`);

    const { JSONmaze, playersList } = (await get(gameRef)).val();
    const currentPlayerId = Object.keys(playersList).at(-1);

    io.sockets.sockets.get(socket.id).emit('players-state-transmition', {
      currentPlayerId,
      playersList,
      JSONmaze,
    });

    socket.emit('update-board-state', playersList);
  });

  socket.on(
    'request-update-player-postion',
    async ({ newPosition, playerId }) => {
      socket.emit('update-player-position', { playerId, newPosition });
    }
  );
});

http.listen(8889, function () {
  console.log('listening on *:8889');
});

module.exports = router;
