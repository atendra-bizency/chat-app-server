const { connectToDatabase } = require('../utils/db');
const User = require('./User');
const SECRET_KEY = 'your_secret_key';
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb'); // If you're using the native MongoDB driver


module.exports = (io) => {
  // Connection
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Send online user list
    socket.emit('get online user', User.getOnlineUser());

    /*
        //  Handle user reconnection
        socket.on('reconnect user', ({ full_name, _id }) => {
          // Check if the user already exists in the User.users Map
          let userExists = false;
    
          User.users.forEach((user) => {
            if (user.id === _id) {
              userExists = true;
            }
          });
    
          console.log(User.users, 'from users reconnect user');  
    
          // If the user doesn't exist, add them back to the User.users Map
          if (!userExists) {
            User.users.set(socket.id, { fullname: full_name, _id, isLogin: true });
            io.emit('new user', { full_name, _id }); // Notify other users
            //console.log(User.users, 'from users');
          }
    
          // Emit the updated online user list
          io.emit('get online user', User.getOnlineUser());
        }); */

    // Login
    // Handle other socket events, like user login event
    socket.on('login', async (fullName, role, userId) => {
      try {
        // Check if the user exists in the database
        const { db } = await connectToDatabase();
        
        const collection = db.collection('users');

        const objectId = new ObjectId(userId);

        const user = await collection.findOne({ _id: objectId });

        if (!user) {
          // If user is not found in the database, emit 'user not found'
          socket.emit('login status', { success: false, message: 'User not found' });
          return;
        }
        // Check if the user is already in the in-memory store (User.users)
        if (User.users.has(socket.id)) {
          socket.emit('login status', { success: false, message: 'You are already logged in' });
          return;
        }
        // Add the user to the in-memory store (tracking by socket.id)
        User.users.set(socket.id, { fullName, userId, role, isLogin: true });

        // Emit the login status to the client
        socket.emit('login status', { success: true, user });

        // Optionally, emit 'new user' to notify other connected users
        io.emit('new user', { fullName, userId, role });

      } catch (error) {
        console.error('Error during socket login:', error);
        socket.emit('login status', { success: false, message: 'Login failed due to an error' });
      }
    });


    // Listen for 'restore session' event from client-side
    socket.on('restore session', async (token) => {
      try {
        // Verify the JWT token sent by the client
        const decoded = jwt.verify(token, SECRET_KEY);

        // Convert the userId string to an ObjectId
        const objectId = new ObjectId(decoded.userId); // Assuming userId is a string representing the ObjectId

        const { db } = await connectToDatabase();

        const collection = db.collection('users');

        const user = await collection.findOne({ _id: objectId });

        if (!user) {
          socket.emit('session restore failed', 'User not found');
          return;
        }

        // Add user to in-memory store
        User.users.set(socket.id, { fullName: user.username, userId: user._id, role: user.role, isLogin: true });

        // Emit user login status
        socket.emit('login status', { success: true, user, token });

      } catch (error) {

        socket.emit('session restore failed', 'Invalid token');

      }
    });

    /*
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
    }); */



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


    /*
    socket.on('send message', (message) => {
      // Ensure the receiver's socket is available

      console.log(message, 'from message');

      const { receiver, sender, chat, type, time } = message;

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
    }); */


    /* socket.on('send message', async (message) => {
      try {
        const { user, role, chat } = message;
        console.log(message, 'from message');
    
        // Initialize conversationId
        let conversationId = message.conversationId || null;
    
        // Find conversation (pass conversationId if agent)
        const conversation = await findConversationByCustomerId(user._id, role, conversationId);
    
        if (!conversation || !conversation.messages.length) {
          console.error('No conversation found or messages are empty.');
          return;
        }
    
        // Get the last message
        const getLastMessage = conversation.messages[conversation.messages.length - 1];
    
        if (!getLastMessage?.receiver) {
          console.error('No valid receiver found in the last message.');
          return;
        }
    
        // Get receiver's socket ID
        const receiverSocket = User.getSocketIdByUserId(new ObjectId(getLastMessage.receiver));
        const senderSocket = socket.id; // Sender's socket
    
        console.log('Receiver Socket:', receiverSocket, 'Sender Socket:', senderSocket);
    
        // Add conversationId to message
        const modifiedMessage = {
          ...message,
          type: 'primary',
          conversationId: conversation._id
        };
    
        // Emit message to receiver
        if (receiverSocket) {
          io.to(receiverSocket).emit('receive message', modifiedMessage);
        } else {
          console.warn('Receiver is not online or socket ID not found.');
        }
    
        // Optionally, send the message back to the sender
        socket.emit('receive message', modifiedMessage);
    
      } catch (error) {
        console.error('Error handling send message event:', error);
      }
    });
     */
    socket.on('send message', async (message) => {
      try {
        const { user, senderId, receiver, chat, role, conversationId } = message;
        console.log(message, 'from message');
    
        let receiverSocket;
    
        if (receiver) {
          // ✅ Directly use receiver from the message if available
          receiverSocket = User.getSocketIdByUserId(new ObjectId(receiver));
        } else {
          // 🛑 If receiver is not provided, fetch conversation to get the receiver
          const conversation = await findConversationByCustomerId(user._id, role, conversationId);
    
          if (!conversation || !conversation.messages.length) {
            console.error('No conversation found or messages are empty.');
            return;
          }
    
          const lastMessage = conversation.messages[conversation.messages.length - 1];
    
          if (!lastMessage?.receiver) {
            console.error('No valid receiver found in the last message.');
            return;
          }
    
          receiverSocket = User.getSocketIdByUserId(new ObjectId(lastMessage.receiver));
        }
    
        const senderSocket = socket.id; // Sender's socket
        console.log('Receiver Socket:', receiverSocket, 'Sender Socket:', senderSocket);
    
        // ✅ Include conversationId in the message
        const modifiedMessage = {
          ...message,
          type: 'primary',
          conversationId: conversationId || null
        };
    
        // ✅ Emit message to the receiver if online
        if (receiverSocket) {
          io.to(receiverSocket).emit('new message', modifiedMessage);
        } else {
          console.warn('Receiver is not online or socket ID not found.');
        }
    
       
    
      } catch (error) {
        console.error('Error handling send message event:', error);
      }
    });
    

    async function findConversationByCustomerId(customerId, role, conversationId) {
      const { db } = await connectToDatabase();  
      if(role === 'agent'){        
        return await db.collection('conversations').findOne({conversation_id: conversationId});
      }else{
        return await db.collection('conversations').findOne({customerId: new ObjectId(customerId) });
      }
  }


    // Helper function to get the socket ID by userId
    function getSocketByUserId(userId) {
      let socketId = null;
      console.log(userId, 'userId');
      console.log(User.users, 'users');

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
    socket.on('close chat', ({ conversationId, senderId, receiverId, message, role }) => {
      if(role="agent"){        
        receiverSocket = User.getSocketIdByUserId(new ObjectId(senderId));
      }else{
        receiverSocket = User.getSocketIdByUserId(new ObjectId(receiverId));
      }
      io.to(receiverSocket).emit('chat closed', { conversationId, message ,senderId, receiverId, type:"information"});
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
