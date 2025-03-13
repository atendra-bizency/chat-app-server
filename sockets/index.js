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

    // Login
    // Handle other socket events, like user login event
    socket.on('login', async (fullName, role, userId, _id) => {
      try {
        // Check if the user exists in the database
        const { db } = await connectToDatabase();
        
        let collection = role === 'agent' ? db.collection('agents') : db.collection('users');

        console.log(userId, 'from userId');
        const objectId = new ObjectId(_id);
        

        const user = await collection.findOne({ _id:objectId });

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
        User.users.set(socket.id, { fullName, userId, role, objectId,isLogin: true });

        console.log(User.users, 'from User.users');
        

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
        console.log(decoded, 'from decoded');
        

        // Convert the userId string to an ObjectId
        const objectId = new ObjectId(decoded.userId); // Assuming userId is a string representing the ObjectId

        const { db } = await connectToDatabase();

        let collection = decoded.role === 'agent' ? db.collection('agents') : db.collection('users');


        const user = await collection.findOne({ _id: objectId });

        if (!user) {
          socket.emit('session restore failed', 'User not found');
          return;
        }

        const uuidToBase64 = (uuid) => {
          // First convert UUID to standard string format
          const uuidString = uuid.toString();
          const hex = uuidString.replace(/-/g, '');
          const buffer = Buffer.from(hex, 'hex');
          return buffer.toString('base64');
        };

        // Add user to in-memory store
        User.users.set(socket.id, { 
          fullName: user.username, 
          userId: user.role === 'agent' ? user.userId : uuidToBase64(user.userId), 
          role: user.role, 
          objectId,
          isLogin: true 
        });
        console.log(User.users, 'from User.users');
        
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

    const uuidToBase64 = (uuid) => {
      // First convert UUID to standard string format
      const uuidString = uuid.toString();
      const hex = uuidString.replace(/-/g, '');
      const buffer = Buffer.from(hex, 'hex');
      return buffer.toString('base64');
    };



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

        console.log(modifiedMessage, 'from modifiedMessage');
        
    
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

    /*
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
    }); */
    

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
