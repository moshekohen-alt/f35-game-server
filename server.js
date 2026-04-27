const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const MAX_PLAYERS = 6;

const rooms = {}; // roomCode -> { players: Map<ws, playerData> }

function generateCode() {
  // 4-digit numeric code: 1000-9999
  const code = String(Math.floor(1000 + Math.random() * 9000));
  return rooms[code] ? generateCode() : code; // ensure unique
}

const wss = new WebSocketServer({ port: PORT });
console.log(`Game server running on port ${PORT}`);

wss.on('connection', (ws) => {
  ws.roomCode = null;
  ws.playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'create': {
        const code = generateCode();
        const playerColor = msg.color || 'blue';
        const playerName = msg.name || 'Player';
        rooms[code] = { players: new Map() };
        rooms[code].players.set(ws, { id: 1, color: playerColor, name: playerName, x: 0, y: 0 });
        ws.roomCode = code;
        ws.playerId = 1;
        ws.send(JSON.stringify({ type: 'created', code, playerId: 1 }));
        console.log(`Room ${code} created`);
        break;
      }

      case 'join': {
        const code = msg.code?.toUpperCase();
        const room = rooms[code];
        if (!room) { ws.send(JSON.stringify({ type: 'error', msg: 'Room not found' })); return; }
        if (room.players.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ type: 'error', msg: 'Room full' })); return; }
        
        const playerId = room.players.size + 1;
        const playerColor = msg.color || 'green';
        const playerName = msg.name || `Player ${playerId}`;
        room.players.set(ws, { id: playerId, color: playerColor, name: playerName, x: 0, y: 0 });
        ws.roomCode = code;
        ws.playerId = playerId;

        // Tell joiner their ID
        ws.send(JSON.stringify({ type: 'joined', code, playerId }));

        // Tell everyone in room about new player
        const allPlayers = [...room.players.values()];
        broadcast(room, { type: 'players', players: allPlayers });
        console.log(`Player ${playerId} joined room ${code} (${room.players.size} total)`);
        break;
      }

      case 'state': {
        // Player sending their position/state
        const room = rooms[ws.roomCode];
        if (!room) return;
        const player = room.players.get(ws);
        if (!player) return;
        // Update stored state
        Object.assign(player, msg.data);
        // Broadcast to everyone else
        broadcastExcept(room, ws, {
          type: 'state',
          playerId: ws.playerId,
          data: msg.data
        });
        break;
      }

      case 'event': {
        // Game events: enemy killed, coin collected, etc.
        const room = rooms[ws.roomCode];
        if (!room) return;
        broadcastExcept(room, ws, {
          type: 'event',
          playerId: ws.playerId,
          event: msg.event,
          data: msg.data
        });
        break;
      }

      case 'start': {
        // Host starts the game
        const room = rooms[ws.roomCode];
        if (!room) return;
        if (ws.playerId !== 1) return; // only host can start
        const allPlayers = [...room.players.values()];
        broadcast(room, { type: 'start', players: allPlayers });
        console.log(`Game started in room ${ws.roomCode}`);
        break;
      }
    }
  });

  ws.on('close', () => {
    const room = rooms[ws.roomCode];
    if (!room) return;
    room.players.delete(ws);
    console.log(`Player left room ${ws.roomCode} (${room.players.size} remaining)`);
    if (room.players.size === 0) {
      delete rooms[ws.roomCode];
      console.log(`Room ${ws.roomCode} deleted`);
    } else {
      // Tell remaining players someone left
      const allPlayers = [...room.players.values()];
      broadcast(room, { type: 'players', players: allPlayers });
    }
  });

  ws.on('error', () => ws.terminate());
});

function broadcast(room, msg) {
  const str = JSON.stringify(msg);
  room.players.forEach((_, ws) => { if (ws.readyState === 1) ws.send(str); });
}

function broadcastExcept(room, sender, msg) {
  const str = JSON.stringify(msg);
  room.players.forEach((_, ws) => { if (ws !== sender && ws.readyState === 1) ws.send(str); });
}
