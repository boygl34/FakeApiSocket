const connectedUsers = {};
const SocketIOServer = (socket, io, db) => {
  const { user } = socket;
  console.log(`${user.fullName} connected`);
  connectedUsers[socket.id] = {
    id: socket.id,
    user: user.fullName,
    Job: user.Job,
  };
  if (["Quản lý", "Lễ tân dịch vụ", "Điều phối SCC", "Điều phối BP", "Đặt Hẹn"].includes(user.Job)) {
    socket.join("Vip");
  }
  socket.emit("getLogins", connectedUsers);
  socket.join(user.fullName);
  socket.emit("loginSuccess", user);

  socket.on("Join Room", (Room) => {
    console.log( user.fullName +" Join "+Room);
    socket.join(Room)
  })
  socket.on("Leave Room", (Room) => {
    console.log(user.fullName+" leave "+Room);
    socket.leave(Room)
  })
  socket.on("Tin nhắn", (data) => {
      socket.broadcast.to(data.socketid).emit("Tin nhắn", data.message);
  });
  socket.on('disconnect', () => {
    console.log(`${user.fullName} disconnect`);
  });
};

export default SocketIOServer;
