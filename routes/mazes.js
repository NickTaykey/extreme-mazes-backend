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
router.post('/', async (req, res, next) => {
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

let currentPlayerLastPosition = [];
let currentPlayerId = null;
let currentMazeId = null;

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', async () => {
    console.log('user disconected');

    if (!currentPlayerId || !currentMazeId) return;

    const playersListPath = `/mazes/${currentMazeId}/playersList`;
    const playersList = (await get(ref(db, playersListPath))).val();

    for (let [pid, obj] of Object.entries(playersList)) {
      if (pid === currentPlayerId) {
        playersList[pid] = { ...obj, lastPosition: currentPlayerLastPosition };
        break;
      }
    }

    set(ref(db, playersListPath), playersList);
  });

  socket.on('add-player', async (mazeId) => {
    const { CELL_WIDTH, CELL_HEIGHT } = maze_helpers;

    currentPlayerLastPosition = [CELL_WIDTH * 0.5, CELL_HEIGHT * 0.5];
    currentMazeId = mazeId;

    await push(ref(db, `/mazes/${currentMazeId}/playersList`), {
      lastPosition: currentPlayerLastPosition,
      color: genRandomHEXColor(),
    });

    const { JSONmaze, playersList } = (
      await get(ref(db, `/mazes/${currentMazeId}`))
    ).val();

    currentPlayerId = Object.keys(playersList).at(-1);

    io.sockets.sockets.get(socket.id).emit('players-state-transmition', {
      playerObject: Object.values(playersList).at(-1),
      playerId: currentPlayerId,
      JSONmaze,
    });

    io.emit('update-board-state', playersList);
  });

  socket.on('board-state-update-request', async ({ mazeId, playerId }) => {
    const gameRef = ref(db, `/mazes/${mazeId}`);

    const { JSONmaze, playersList } = (await get(gameRef)).val();
    currentPlayerId = playerId;
    currentMazeId = mazeId;

    io.sockets.sockets.get(socket.id).emit('players-state-transmition', {
      playerObject: playersList[playerId],
      playerId,
      JSONmaze,
    });

    io.emit('update-board-state', playersList);
  });

  socket.on(
    'request-update-player-postion',
    async ({ newPosition, playerId }) => {
      currentPlayerLastPosition = newPosition;
      socket.broadcast.emit('update-player-position', {
        newPosition,
        playerId,
      });
    }
  );
});

http.listen(8889, () => {
  console.log('listening on *:8889');
});

module.exports = router;
