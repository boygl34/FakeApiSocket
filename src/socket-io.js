const SocketIOServer = (socket, io, db) => {
  console.log('An user connected');
  socket.emit('emit', db.data.products);
  
  socket.on('login', (msg) => {
    console.log('login',msg.name);
    socket.emit('login', `wellcom ${msg.name} !!`);
  });

  socket.on('broadcast', (msg) => {
    socket.broadcast.emit('broadcast', msg);
  });

  socket.on('broadcast-all', (msg) => {
    io.emit('broadcast-all', msg);
  });

  socket.on('join-room', (roomName) => {
    socket.join(roomName);
  });

  socket.on('emit-in-room', ({ room, event, msg }) => {
    socket.to(room).emit(event, msg);
  });

  socket.on('disconnect', () => {
    console.log('An user disconnected');
  });
};

export default SocketIOServer;
