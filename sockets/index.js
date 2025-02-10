const User = require('./User');

module.exports = (io) => {
  // Connection
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Send online user list
    socket.emit('get online user', User.getOnlineUser());


    //  Handle user reconnection
    socket.on('reconnect user', ({ full_name, _id }) => {
      // Check if the user already exists in the User.users Map
      let userExists = false;  

      User.users.forEach((user) => {
        if (user.id === _id) {
          userExists = true;
        }
      });



      // If the user doesn't exist, add them back to the User.users Map
      if (!userExists) {
        User.users.set(socket.id, { fullname: full_name, _id, isLogin: true });
        io.emit('new user', { full_name, _id }); // Notify other users
        //console.log(User.users, 'from users');
      }

      // Emit the updated online user list
      io.emit('get online user', User.getOnlineUser());
    });





    // Login
    socket.on('login', async (fullName, userId) => {
      // Check user
      let isUsing = false;

      // Check if the user already exists in the database
       const existingUser = await User.findOne({ fullName });
 
       if (existingUser) {
         isUsing = true;
       } else {
         // Save user data in the database
         const newUser = new User({
           userId,
           fullName,
           isLogin: true
         });
 
         await newUser.save();
       } 
      User.users.forEach((key) => {
        if (key.id == userId) {
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

        // Emit event to notify others
        io.emit('new user', { fullName, userId });
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



  

    // Handle sending message
    socket.on('send message', (message) => {
      // Ensure the receiver's socket is available

      console.log(message, 'from message');

      const { receiver, sender , chat, type , time} = message;
      
      const receiverSocket = getSocketByUserId(message.receiver);
      const senderSocket = socket.id;  // sender's socket is the one connected

      //console.log(User.users, 'from users send message');


      console.log('receiverSocket:', receiverSocket);

        // Swap receiver and sender in the message object
  const modifiedMessage = {
    ...message, // Copy all existing properties
    type: 'primary' // Swap sender to receiver
  };

      //console.log('senderSocket:', senderSocket);
      if (receiverSocket) {
        // Emit the message to the receiver's socket
        io.to(receiverSocket).emit('receive message', modifiedMessage);
      }

      // Optionally, emit the message back to the sender
      //socket.emit('receive message', message);
    });

    // Helper function to get the socket ID by userId
    function getSocketByUserId(userId) {
      let socketId = null;
      //console.log(userId, 'userId');
      //console.log(User.users, 'users');

      User.users.forEach((user, id) => {
        if (user._id == userId) {
          socketId = id;
        }
      });
      return socketId;
    }

    // Send private message
    socket.on('sendPrivateMessage', ({ room, message }) => {
      // Broadcast the message to all users in the private room
      io.to(room).emit('newPrivateMessage', message);
    });

    // Send message to all connected users
    socket.on('send message', (message) => {
      //socket.broadcast.emit('new message', message);
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
