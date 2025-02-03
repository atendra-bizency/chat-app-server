const User = require('./User');

module.exports = (io) => {
  // Connection
  io.on('connection', (socket) => {
    // Send online user list
    socket.emit('get online user', User.getOnlineUser());

    let connectedUser = new User(socket.id, false);
    User.users.set(socket.id, connectedUser);

    // Login
    socket.on('login', (fullName, userId) => {
      // Check user
      let isUsing = false;
      User.users.forEach((key) => {
        if (key.fullname == fullName) {
          isUsing = true;
        }
      });
      socket.emit('check user', isUsing);

      // Add User
      if (!isUsing) {
        if (!User.users.has(socket.id)) {
            User.users.set(socket.id, { fullname: fullName, userId, isLogin: true });
        } else {
            let currentUser = User.users.get(socket.id);
            currentUser.isLogin = true;
            currentUser.fullname = fullName;
            currentUser.userId = userId;
        }

        console.log(userId);
        

        // Emit event to notify others
        io.emit('new user', { fullName, userId });

        // Save user info locally in the browser
        socket.emit('store user', { fullName, userId });
    }
    });

    // LoginId
    socket.on('loginId', (Id) => {
      let currentUser = User.users.get(socket.id);
      if (currentUser) {
        currentUser.isLogin = true;
        currentUser.Id = Id;
        io.emit('userId', currentUser.Id);
      }
    });

    // Join private room
  // Backend: Prevent loops in event handling
socket.on('joinPrivateRoom', ({ user1, user2 }) => {
  const roomName = createRoomName(user1, user2);

  // Add the socket to the private room
  socket.join(roomName);

  // Notify only the initiating user about the room creation
  socket.emit('privateRoomJoined', roomName);

  // Optionally notify all members of the room (not required for initiating user)
  // io.to(roomName).emit('userJoinedRoom', { room: roomName, user: user1 });
});

socket.on('send message', (message) => {
  console.log('Message received on server:', message);

  // Emit the message to the receiver's socket
  io.emit('receive message', message);
});

    // Send private message
    socket.on('sendPrivateMessage', ({ room, message }) => {
      // Broadcast the message to all users in the private room
      io.to(room).emit('newPrivateMessage', message);
    });

    // Send message to all connected users
    socket.on('send message', (message) => {
      socket.broadcast.emit('new message', message);
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      User.users.delete(socket.id);
      io.emit('get online user', User.getOnlineUser());
    });
  });
};

function createRoomName(user1, user2) {
  return `privateRoom_${user1}_${user2}`;
}
