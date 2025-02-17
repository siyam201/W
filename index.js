
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    const rooms = io.sockets.adapter.rooms;
    const room = rooms.get(roomId);
    
    if (room === undefined || room.size < 2) {
      socket.join(roomId);
      socket.emit('joined', roomId);
    } else {
      socket.emit('full', roomId);
    }
  });

  socket.on('offer', (offer, roomId) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('file-share', (fileData, roomId) => {
    socket.to(roomId).emit('file-share', fileData);
  });
});

http.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
