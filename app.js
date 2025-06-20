var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser'); // Import body-parser
const mongoose = require('mongoose');
const { ObjectId , Binary} = require('mongodb');  // Ensure ObjectId is imported
const multer = require('multer');
const upload = multer(); // Initialize multer middleware
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Express
var app = express();
// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Enable JSON parsing for POST requests
app.use(bodyParser.json()); // Use body-parser for JSON parsing
app.use(cookieParser());
app.use(logger('dev'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection details


const mongoURI = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

const profileImageDir = path.join(__dirname, '../styles/profile');


//require Files
const messages = require('./models/messagesSchema');
const { connectToDatabase, closeDatabaseConnection } = require('./utils/db'); // Import the utility module
const Message = require('./models/messagesSchema');
const Conversation = require('./models/convercationSchema');
const jwt = require('jsonwebtoken');




/*
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and role are required' });
  }

  try {
    const { db } = await connectToDatabase();
    let collection = role === 'agent' ? db.collection('agents') : db.collection('users');

    // Find user
    let user = await collection.findOne({ username, role });

    // Create new user if not exists
    if (!user) {    
      const newUser = {
        userId: UUID(), // Generate UUID
        username,
        role,
      };
      await collection.insertOne(newUser);
      user = newUser;
    }

    console.log(user, 'user');
    

      // Convert UUID to Base64 (updated version)
    const uuidToBase64 = (uuid) => {
      // First convert UUID to standard string format
      const uuidString = uuid.toString();
      const hex = uuidString.replace(/-/g, '');
      const buffer = Buffer.from(hex, 'hex');
      return buffer.toString('base64');
    };

    // Prepare user data for response
    const clientUserData = {
      ...user,
      userId: role === 'agent' ? user.userId : uuidToBase64(user.userId)
    };

    // Generate JWT using original UUID
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Use UUID here
      'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      message: 'Login successful', 
      user: clientUserData, 
      token 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}); */

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and role are required' });
  }

  try {
    const { db } = await connectToDatabase();
    let collection = role === 'agent' ? db.collection('agents') : db.collection('users');

    // Find user
    let user = await collection.findOne({ username, role });

    // Create new user if not exists
    if (!user) {    
      const newUser = {
        userId: UUID(), // Generate UUID
        username,
        role,
      };
      await collection.insertOne(newUser);
      user = newUser;
    }

    console.log(user, 'user');
    

      // Convert UUID to Base64 (updated version)
    const uuidToBase64 = (uuid) => {
      // First convert UUID to standard string format
      const uuidString = uuid.toString();
      const hex = uuidString.replace(/-/g, '');
      const buffer = Buffer.from(hex, 'hex');
      return buffer.toString('base64');
    };

    // Prepare user data for response
    const clientUserData = {
      ...user,
      userId: role === 'agent' ? user.userId : uuidToBase64(user.userId)
    };

    // Generate JWT using original UUID
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Use UUID here
      'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      message: 'Login successful', 
      user, 
      token 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/*
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;


  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and role are required' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');

    // Check if user exists
    let user = await collection.findOne({ username, role });

    if (user) {
      // User exists, verify password for agents
      if (role === 'agent') {
        if (!password) {
          return res.status(400).json({ success: false, message: 'Password is required for agents' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid password' });
        }
      }
    } else {
      // User does not exist, create new user
      const newUser = {
        //_id: uuidv4(), // Generate a unique ID
        username,
        role,
      };

      // Hash password only for agents
      if (role === 'agent') {
        if (!password) {
          return res.status(400).json({ success: false, message: 'Password is required for agents' });
        }
        newUser.password = await bcrypt.hash(password, 10);
      }

      // Insert new user into database
      await collection.insertOne(newUser);
      user = newUser;
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, 'your_secret_key', { expiresIn: '7d' });



    res.json({ success: true, message: 'Login successful', user, token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}); */



app.post('/api/register', async (req, res) => {
  try {
    // Destructure the fields from the request body
    const { username, full_name, email, password, phone, address, country, img, status } = req.body;

    // Check if all required fields are provided
    if (!username || !full_name || !email || !password || !phone || !address || !country) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if the email format is valid (simple check, you can improve this)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zAZ0-9.-]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Connect to the database
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Check if the username or email already exists in the database
    const existingUser = await collection.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }

    // Hash the password before saving it to the database
    const saltRounds = 10; // This defines the complexity of the hash
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Set status to 1 by default if not provided
    const userStatus = status || 1;

    // Create a new user document
    const newUser = {
      username,
      full_name,
      email,
      password: hashedPassword, // Save the hashed password
      phone,
      address,
      country,
      img,
      status: userStatus, // Use default status if not provided
    };

    // Insert the new user into the database
    const result = await collection.insertOne(newUser);

    // Add logging to debug the result of insertOne
    console.log('Insert Result:', result);

    if (result.insertedId === 1) {
      res.status(201).json({ success: true, message: 'User registered successfully' });
    } else {
      throw new Error('User registration failed');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
});


// Define the route for uploading profile images
app.post('/api/uploadProfileImage', (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const profileImage = req.files.profileImage;

    if (!fs.existsSync(profileImageDir)) {
      fs.mkdirSync(profileImageDir, { recursive: true });
    }

    const fileName = Date.now() + '_' + profileImage.name;

    profileImage.mv(path.join(profileImageDir, fileName), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error saving file.' });
      }

      res.status(200).json({ path: `/styles/profile/${fileName}` });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});


// API endpoint for deleting a message by message_id
app.delete('/api/messages/:messageId', async (req, res) => {
  const messageId = req.params.messageId;
  const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  try {
    // Use deleteMany to find and delete a document by message_id
    const result = await db.collection('messages').deleteMany({ message_id: parseInt(messageId) });

    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Message deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Message not found' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

//-------------update password -----------------
app.post('/api/updatePassword', async (req, res) => {
  const { id, oldPassword, newPassword, verifyPassword } = req.body;

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('users');

    // Verify old password for the given ID
    const user = await collection.findOne({ id: id, password: oldPassword });

    // Check if user exists and old password matches
    if (!user) {
      client.close();
      return res.status(400).json({ message: 'Invalid ID or old password.' });
    }

    // Check if new password matches verification password
    if (newPassword !== verifyPassword) {
      client.close();
      return res.status(400).json({ message: 'New password and verification password must match.' });
    }

    // Update the user's password
    await collection.updateOne(
      { id: id }, // Query condition
      { $set: { password: newPassword } } // Update operation
    );

    // Close MongoDB connection
    client.close();

    // Send response
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});
//-------------- update password end -----------

app.post('/api/updateuserinfo', async (req, res) => {
  const { id, fieldsToUpdate } = req.body;

  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Construct the update object based on the fields to update
    const updateObject = {};
    for (const field in fieldsToUpdate) {
      updateObject[field] = fieldsToUpdate[field];
    }

    // Update the specified fields for the user
    const result = await collection.updateOne({ id }, { $set: updateObject });

    await client.close();

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User information updated successfully' });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/updateSessionId', async (req, res) => {
  const { id, sessionId } = req.body;

  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Update the session ID for the specified user
    const result = await collection.updateOne({ id }, { $set: { session_id: sessionId } });

    await client.close();

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Session ID updated successfully' });
  } catch (error) {
    console.error('Error updating session ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const users = await db.collection('users').find({}).toArray();

    await client.close();

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

//send message


app.post('/api/sendMessage', async (req, res) => {
  const { client, db } = await connectToDatabase();
  const session = client.startSession(); // Start session from client
  let newMessage; // Declare it here to use later in socket logic

  try {
    const { senderId, chat, role, conversationId } = req.body;
    const currentTime = new Date();

    if (!senderId || !chat || !role) {
      return res.status(400).json({ error: 'Sender, message, and role are required' });
    }

    console.log(`🔍 Processing message from sender: ${senderId} | Role: ${role}`);

    let conversation;
    let agent;
    let team;
    let agentId; // Store agentId separately for consistency

    // Start Transaction
   // await session.withTransaction(async () => {
      // 1️⃣ **Check for an existing open conversation**
      /* conversation = await db.collection('conversations').findOne({
         customerId: new ObjectId(senderId),
         status: 'open'
       }); */
      conversation = await db.collection('conversations').findOne({
        conversation_id: conversationId,
        //status: 'open'
      });

      if (!conversation) {
        console.log('📌 No active conversation. Assigning a team and agent.');

        // 2️⃣ **Find a suitable team**
        team = await db.collection('teams').findOne({});
        if (!team) throw new Error('No available teams to assign.');

        console.log(`✅ Assigned Team: ${team.teamId}`);

        // 3️⃣ **Find an available agent in that team**
        agent = await db.collection('agents').findOneAndUpdate(
          //{ team: team.teamId, isAvailable: true },
          { teamId: team.teamId, isAvailable: true },
          { $set: { isAvailable: true } },
          { returnOriginal: false, session }
        );

        if (!agent.value) throw new Error('No available agents at this time.');

        //agentId = agent.value._id; // Normalize agent ID
        agentId = agent.value._id; // Normalize agent ID
        agent = await db.collection('agents').findOne({ _id: new ObjectId(agentId) });

        console.log(`✅ Assigned Agent: ${agentId}`);

        // 4️⃣ **Create a new conversation**
        const lastConv = await db.collection('conversations').findOne({}, { sort: { conversation_id: -1 } });

        conversation = {
          conversation_id: (lastConv?.conversation_id || 0) + 1,
          customerId: new ObjectId(senderId),
          agentId: agentId,
          //agentId: new ObjectId(agentId),
          team: team.teamId,
          created_at: currentTime,
          status: 'open',
          messages: []
        };

        await db.collection('conversations').insertOne(conversation, { session });

        console.log(`📌 New conversation started: ${conversation.conversation_id}`);
      } else {
        console.log(`📌 Existing conversation found: ${conversation.conversation_id}`);
        console.log(`📌 Existing conversation found: ${conversation.agentId}`);
        team = conversation.team;
        agent = await db.collection('agents').findOne({ _id: new ObjectId(conversation.agentId) });
        agentId = agent?._id; // Normalize agent ID

        console.log(`📌 Assigned existing agent: ${agentId}`);
      }

      // 5️⃣ **Create and store the message**
      const lastMessage = await db.collection('messages').findOne({}, { sort: { message_id: -1 } });

      newMessage = {
        message_id: (lastMessage?.message_id || 0) + 1,
        conversation_id: conversation.conversation_id,
        senderId: new ObjectId(senderId),
        //receiver: new ObjectId(agentId), // Ensure receiver is correctly assigned
        receiver: agentId, // Ensure receiver is correctly assigned
        team,
        chat,
        timestamp: currentTime,
        status: 'unread'
      };

      console.log('📌 New Message:', newMessage);

      await db.collection('messages').insertOne(newMessage, { session });

      // 6️⃣ **Update conversation with the latest message**
      await db.collection('conversations').updateOne(
        { conversation_id: conversation.conversation_id },
        {
          $push: { messages: newMessage },
          $set: { last_activity: currentTime }
        },
        { session }
      );

      console.log(`📌 Message stored: ${newMessage.message_id}`);
    //});

    console.log(`✅ Message successfully processed for sender: ${senderId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent to support',
      assignedAgent: agentId,
      assignedAgentDetails: agent,
      conversationId: conversation.conversation_id,
      chat: newMessage
    });

  } catch (error) {
    console.error('❌ Error in message routing:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });

  } finally {
    await session.endSession(); // End the transaction session
    await closeDatabaseConnection();
  }
});





app.post('/api/sendAgentMessage', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { senderId, conversationId, chat, role } = req.body;

    console.log(req.body, 'req.body');

    const currentTime = new Date();

    if (!senderId || !conversationId || !chat) {
      return res.status(400).json({ error: 'Agent ID, conversation ID, and message are required' });
    }

    // 1. Find the existing conversation
    const conversation = await db.collection('conversations').findOne({
      conversation_id: parseInt(conversationId, 10),
      //status: 'open'
    });

    if (!conversation) {
      return res.status(404).json({ error: 'No active conversation found' });
    }

    // 2. Get the customer ID from the conversation
    const customerId = conversation.customerId;

    // 3. Create the new agent message
    const lastMessage = await db.collection('messages').findOne({}, { sort: { message_id: -1 } });

    const newMessage = {
      message_id: (lastMessage?.message_id || 0) + 1,
      conversation_id: JSON.parse(conversationId),
      senderId: senderId,
      receiverId: customerId,
      team: conversation.team,
      chat,
      timestamp: currentTime,
      status: 'unread'
    };

    // 4. Store the message in the database
    await db.collection('messages').insertOne(newMessage);

    // 5. Update the conversation with the latest message
    await db.collection('conversations').updateOne(
      { conversation_id: parseInt(conversationId, 10), },
      {
        $push: { messages: newMessage },
        $set: { last_activity: currentTime }
      }
    );

    //const userIdBuffer = Buffer.from(customerId, 'base64');       

    res.status(201).json({
      success: true,
      message: 'Message sent to customer',
      chat: newMessage,
      assignedAgent: customerId,
      conversation, 
      conversationId:JSON.parse(conversationId),
      assignedAgentDetails: await db.collection('users').findOne({ _id: new ObjectId(customerId) })
    });

  } catch (error) {
    console.error('Error sending agent message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  } finally {
    await closeDatabaseConnection();
  }
});

/*
app.post('/api/sendAgentMessage', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { senderId, conversationId, chat, role } = req.body;

    console.log(req.body, 'req.body');

    const currentTime = new Date();

    if (!senderId || !conversationId || !chat) {
      return res.status(400).json({ error: 'Agent ID, conversation ID, and message are required' });
    }

    // 1. Find the existing conversation
    const conversation = await db.collection('conversations').findOne({
      conversation_id: parseInt(conversationId, 10),
      //status: 'open'
    });

    if (!conversation) {
      return res.status(404).json({ error: 'No active conversation found' });
    }

    // 2. Get the customer ID from the conversation
    const customerId = conversation.customerId;

    // 3. Create the new agent message
    const lastMessage = await db.collection('messages').findOne({}, { sort: { message_id: -1 } });

    const newMessage = {
      message_id: (lastMessage?.message_id || 0) + 1,
      conversation_id: JSON.parse(conversationId),
      senderId: new ObjectId(senderId),
      receiverId: new ObjectId(customerId),
      team: conversation.team,
      chat,
      timestamp: currentTime,
      status: 'unread'
    };

    // 4. Store the message in the database
    await db.collection('messages').insertOne(newMessage);

    // 5. Update the conversation with the latest message
    await db.collection('conversations').updateOne(
      { conversation_id: parseInt(conversationId, 10), },
      {
        $push: { messages: newMessage },
        $set: { last_activity: currentTime }
      }
    );
    res.status(201).json({
      success: true,
      message: 'Message sent to customer',
      chat: newMessage,
      conversation, 
      assignedAgentDetails: await db.collection('users').findOne({ _id: new ObjectId(customerId) })
    });

  } catch (error) {
    console.error('Error sending agent message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  } finally {
    await closeDatabaseConnection();
  }
}); */



// Helper function to get socketId by userId
const getSocketIdByUserId = (userId) => {
  return userSocketMap.get(userId);
};




const Agent = require('./models/Agents'); // Import the Agent model
const User = require('./sockets/User');
const { UUID } = require('bson');

// Create Agent API
/*
app.post('/api/agents', async (req, res) => {
  try {

    const {db} = await connectToDatabase();
    const { userId, username, team, isAvailable, currentChatId, lastActivity } = req.body;

    // Validate required fields
    if (!userId || !username || !team) {
      return res.status(400).json({ error: 'userId, fullName, and team are required' });
    }

    // Check if agent already exists
    const existingAgent = await db.collection('agents').findOne({ userId });
    if (existingAgent) {
      return res.status(409).json({ error: 'Agent with this userId already exists' });
    }

    // Create new agent document
    const newAgent = {
      userId,
      username,
      team,
      isAvailable: isAvailable ?? true, // Default to true
      currentChatId: currentChatId ?? null,
      lastActivity: lastActivity ? new Date(lastActivity) : new Date()
    };

    // Save to database
    await db.collection('agents').insertOne(newAgent);


    res.status(201).json({ message: 'Agent created successfully', agent: newAgent });

  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}); */

app.post('/api/agents', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const {
      userId,
      teamId,
      maxUserAllowed,
      idleTime,
      idleOperatorOffline,
      sendFileVisitor,
      status,
      clientUserId,
      clientMasterId,
      isAvailable,
      lastActivity,
      username // Updated user data from MySQL
    } = req.body;

    // Validate required fields
    if (!userId || !status) {
      return res.status(400).json({ error: 'userId and status are required' });
    }

    // Check if agent already exists in MongoDB
    const existingAgent = await db.collection('agents').findOne({ userId });
    if (existingAgent) {
      return res.status(409).json({ error: 'Agent with this userId already exists' });
    }

    // Create new agent document
    const newAgent = {
      userId,
      teamId:teamId ?? null,
      maxUserAllowed: maxUserAllowed ?? null,
      idleTime: idleTime ??null,
      idleOperatorOffline: idleOperatorOffline ??null,
      sendFileVisitor: sendFileVisitor ??null,
      status,
      clientUserId,
      clientMasterId,
      isAvailable: isAvailable ?? true, // Default to true
      lastActivity: lastActivity ? new Date(lastActivity) : new Date(),
      username ,// Store the latest MySQL user data in MongoDB,
      role: 'agent'
    };

    // Insert into MongoDB
    await db.collection('agents').insertOne(newAgent);

    res.status(201).json({ message: 'Agent created successfully', agent: newAgent });

  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/agents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    //console.log(userId);
    
    const { db } = await connectToDatabase();
    const { teamId, maxUserAllowed, idleTime, idleOperatorOffline, sendFileVisitor, status } = req.body;
    //console.log(req.body);

    // Validate required fields
    if (!teamId || !status) {
      return res.status(400).json({ error: 'teamId and status are required' });
    }

    // Check if the agent exists
    const existingAgent = await db.collection('agents').findOne({ userId: userId });
    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update the agent document
    const updatedAgent = {
      teamId,
      maxUserAllowed,
      idleTime,
      idleOperatorOffline,
      sendFileVisitor,
      status,
    };

    await db.collection('agents').updateOne(
      { userId: userId },
      { $set: updatedAgent }
    );

    res.status(200).json({ message: 'Agent updated successfully', agent: updatedAgent });

  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});




// Create Team API
app.post('/api/teams', async (req, res) => {
  try {

    const db = await connectToDatabase();
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Check if team already exists
    const existingTeam = await db.collection('teams').findOne({ name });
    if (existingTeam) {
      return res.status(409).json({ error: 'Team with this name already exists' });
    }

    // Create new team document
    const newTeam = {
      name,
      description
    };

    // Save to database
    await db.collection('teams').insertOne(newTeam);


    res.status(201).json({ message: 'Team created successfully', team: newTeam });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


// Create Team and Assign Multiple Agents
app.post('/api/teams/create', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { name, agentIds } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({ error: 'agentIds must be a non-empty array' });
    }

    // Check if the team already exists
    let team = await db.collection('teams').findOne({ name });

    if (!team) {
      // Create a new team
      const newTeam = {
        name,
        agents: agentIds
      };
      const result = await db.collection('teams').insertOne(newTeam);
      team = { _id: result.insertedId, ...newTeam }; // Update team reference
    } else {
      // If team exists, add agents (avoid duplicates)
      const updatedAgents = [...new Set([...team.agents, ...agentIds])];

      await db.collection('teams').updateOne(
        { name }, // Find the team by name
        { $set: { agents: updatedAgents } } // Update the agents list
      );
    }

    // Update agents with assigned team
    await db.collection('agents').updateMany(
      { _id: { $in: agentIds.map(id => new ObjectId(id)) } }, // Ensure ObjectId conversion
      { $set: { team: name } }
    );

    res.status(201).json({
      message: `Team '${name}' created/updated successfully`,
      teamId: team._id,
      assignedAgents: agentIds
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});




// Get messages for a specific conversation
app.get('/api/getMessage/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  console.log(conversationId);
  
  if (!conversationId) return res.status(200).json([]);
  const { db } = await connectToDatabase();

  try {
    // Find the conversation to get the agentId
    const conversation = await db.collection('conversations').findOne(
      { conversation_id: parseInt(conversationId) }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Extract agentId from the conversation
    const { agentId } = conversation;

    // Update conversation status to "closed"
    await db.collection('conversations').updateOne(
      { conversation_id: parseInt(conversationId) }, // Find by conversation_id
      { $set: { status: 'closed' } } // Update status to closed
    );

  
    await db.collection('agents').updateOne(
      { userId: new ObjectId(agentId) }, // Find by conversation_id
      { $set: { isAvailable: 'true' } } // Update status to closed
    );

    // Close the database connection (if not using persistent connection)
    await closeDatabaseConnection();

    // Return the messages for the conversation
    res.status(200).json({
      message: 'Messages retrieved successfully, conversation closed.',
      agentId,
      customerId: conversation.customerId,
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});




// Get conversations for a specific user
// Get conversation by customerId

app.get('/api/conversation/:role/:userId', async (req, res) => {
  try {
    const { userId, role } = req.params;
    const { db } = await connectToDatabase();

    //console.log(role, '===>role');
     //console.log(userId, '===>userId');

   /* if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    } */
    const conversations = await db.collection('conversations').find({
      $or: [
        { customerId: new ObjectId(userId) },
        { agentId: new ObjectId(userId) }
      ]
    }).toArray();



    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ success: false, message: 'No conversations found for this customer' });
    }

    let conversationsWithDetails
    if (role === 'customer') {


      // Map through each conversation to fetch agent and team details (if applicable)
      conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          // Initialize agentDetails and teamDetails as null
          let agentDetails = null;
          let teamDetails = null;

          //console.log(conversation, '===>conversations from inside');

          //console.log(conversation.agentId, '===>conversation.agentId');


          // Fetch agent details if an agent is assigned
          if (conversation.agentId) {
            agentDetails = await db.collection('agents').findOne({ _id: conversation.agentId });

           /* if (agentDetails) {
              agentDetails = await db.collection('users').findOne({ _id: new ObjectId(conversation.agentId) });
            } */

          }

          // Fetch team details if a team is assigned (and is a string or valid ID)
          if (conversation.team && typeof conversation.team === 'string') {
            teamDetails = await db.collection('teams').findOne({ teamId: conversation.team });
          }

          // Return the conversation with its respective agent and team details
          return {
            ...conversation,
            agentDetails,
            teamDetails,
          };
        })
      );
    } else {
      conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          // Initialize agentDetails and teamDetails as null
          let agentDetails = null;
          let teamDetails = null;

          //console.log(conversation, '===>conversations from inside');

                    // Convert base64 to Buffer
          //const userIdBuffer = Buffer.from(conversation.customerId, 'base64');       

          // Fetch agent details if an agent is assigned
          if (conversation.customerId) {
            agentDetails = await db.collection('users').findOne({ _id: new ObjectId(conversation.customerId) });
          }

          // Fetch team details if a team is assigned (and is a string or valid ID)
          if (conversation.team && typeof conversation.team === 'string') {
            teamDetails = await db.collection('teams').findOne({ teamId: conversation.team });
          }

          // Return the conversation with its respective agent and team details
          return {
            ...conversation,
            agentDetails,
            teamDetails,
          };
        })
      );

    }

    // Validate userId format


    //console.log(conversations, '===>conversations');

    // If no conversations are found, return an appropriate response


    // Send the response with all the conversations and their associated details
    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversationsWithDetails,
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


app.post('/api/conversation/:userId', async (req, res) => {
  try {
    const { userId, } = req.params;
    const { db } = await connectToDatabase();

    //console.log(role, '===>role');
    // console.log(userId, '===>userId');

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }
    const conversations = await db.collection('conversations').find({
      $or: [
        { customerId: new ObjectId(userId) },
        { agentId: new ObjectId(userId) }
      ]
    }).toArray();



    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ success: false, message: 'No conversations found for this customer' });
    }

    let conversationsWithDetails
    if (role === 'customer') {


      // Map through each conversation to fetch agent and team details (if applicable)
      conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          // Initialize agentDetails and teamDetails as null
          let agentDetails = null;
          let teamDetails = null;

          //console.log(conversation, '===>conversations from inside');

          //console.log(conversation.agentId, '===>conversation.agentId');


          // Fetch agent details if an agent is assigned
          if (conversation.agentId) {
            agentDetails = await db.collection('agents').findOne({ userId: new ObjectId(conversation.agentId) });

            if (agentDetails) {
              agentDetails = await db.collection('users').findOne({ _id: new ObjectId(conversation.agentId) });
            }

          }

          // Fetch team details if a team is assigned (and is a string or valid ID)
          if (conversation.team && typeof conversation.team === 'string') {
            teamDetails = await db.collection('teams').findOne({ teamId: conversation.team });
          }

          // Return the conversation with its respective agent and team details
          return {
            ...conversation,
            agentDetails,
            teamDetails,
          };
        })
      );
    } else {
      conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          // Initialize agentDetails and teamDetails as null
          let agentDetails = null;
          let teamDetails = null;

          // Fetch agent details if an agent is assigned
          if (conversation.customerId) {
            agentDetails = await db.collection('users').findOne({ _id: conversation.customerId });
          }

          // Fetch team details if a team is assigned (and is a string or valid ID)
          if (conversation.team && typeof conversation.team === 'string') {
            teamDetails = await db.collection('teams').findOne({ teamId: conversation.team });
          }

          // Return the conversation with its respective agent and team details
          return {
            ...conversation,
            agentDetails,
            teamDetails,
          };
        })
      );

    }

    // Validate userId format


    //console.log(conversations, '===>conversations');

    // If no conversations are found, return an appropriate response


    // Send the response with all the conversations and their associated details
    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversationsWithDetails,
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get conversations for a specific user
app.post('/api/conversation', async (req, res) => {
  const { customerId, agentId } = req.body; // Receive both sender and receiver from request body


  console.log( customerId);
  

  try {
    // Reuse the existing database connection
    const{ db} = await connectToDatabase();    
    // Find conversations where both sender and receiver are participants
    const conversations = await db.collection('conversations').find({
      $and: [
        { customerId: new ObjectId(customerId) }, // Match customerId
        { agentId: new ObjectId(agentId) } // Match agentId
      ]
    }).toArray();

    console.log('conversations=>>>>',conversations);


    // If no conversations are found, send an appropriate message
    if (conversations.length === 0) {
      return res.status(200).json({ message: false });
    }

    

    // Close the database connection (if not using persistent connection)
    await closeDatabaseConnection();

    // Return the list of conversations
    res.status(200).json({
      message: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/sendDocument', upload.single('file'), async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);

    const { sender, receiver, date, time, documentName, contentType } = req.body;

    // Fetch the last message to get the latest message_id
    const lastMessage = await db.collection('messages').findOne({}, { sort: { message_id: -1 } });

    // Calculate the new message_id
    const newMessageId = (lastMessage ? lastMessage.message_id : 0) + 1;

    // Access the file content from req.file.buffer
    const documentBuffer = req.file.buffer;

    // Save document to the database with entire content
    const documentMessage = {
      message_id: newMessageId,
      sender,
      receiver,
      date,
      time,
      documentName,
      contentType,
      content: documentBuffer.toString('base64'), // Convert Buffer to base64 string
      status: '3',
    };

    await db.collection('messages').insertOne(documentMessage);

    res.json({ message: 'Document message sent successfully', documentMessage });

    await client.close();
  } catch (error) {
    console.error('Error sending document message:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/adverts', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const adverts = await db.collection('advert').find({ status: 0 }).toArray();

    await client.close();

    res.json(adverts);
  } catch (error) {
    console.error('Error fetching adverts:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/api/getMessages', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);

    const { userId, otherUserId } = req.body;

    // Fetch and sort messages between the current user and the selected user by date and time
    const messages = await db.collection('messages').find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ date: 1, time: 1 }).toArray();

    await client.close();

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});
/// push notification
app.post('/api/getNotifications', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);

    const { userFullName } = req.body;
    const notifications = await db.collection('messages')
      .find({ receiver: userFullName })

      .sort({ createdAt: -1 })
      .toArray();

    await client.close();

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Function to fetch user details

app.post('/api/authenticate', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ username, password });

    await client.close();

    if (user) {
      // Include the complete user information in the JSON response
      const response = {
        _id: user._id,
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        project: user.project,
        invoice: user.invoice,
        deadline: user.deadline,
        budget: user.budget,
        session_id: user.session_id,
        img: user.img,
        status: user.status,
      };
      res.json(response);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/api/getUserInfo', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ id });

    await client.close();

    if (user) {
      const response = {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        project: user.project,
        invoice: user.invoice,
        deadline: user.deadline,
        budget: user.budget,
        session_id: user.session_id,
        status: user.status,
        img: user.img,
      };
      res.json(response);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/getUserInfoByName', async (req, res) => {
  try {
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ full_name });

    await client.close();

    if (user) {
      const response = {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        project: user.project,
        invoice: user.invoice,
        deadline: user.deadline,
        budget: user.budget,
        img: user.img,
        session_id: user.session_id,
        status: user.status,
      };
      res.json(response);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).send('Internal Server Error');
  }
});

//-------block user start ------------------
app.post('/api/blockUser', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const { full_name } = req.body;
    const collection = db.collection('users');

    // Update the user document in the collection
    const result = await collection.updateOne(
      { full_name },
      { $set: { password: 0, status: 0, session_id: null } }
    );

    // Check if the update operation was successful
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
//-------block user end --------------------



//-------unblock user start ------------------
app.post('/api/unblockUser', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const { full_name } = req.body;
    const collection = db.collection('users');

    // Update the user document in the collection
    const result = await collection.updateOne(
      { full_name },
      { $set: { password: "1", status: 1, session_id: null } }
    );

    // Check if the update operation was successful
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//-----------------------------------------------


// Function to fetch user transactions
app.post('/api/userTransactions', async (req, res) => {
  try {
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const userTransactions = await db.collection('user_transaction').find({ full_name }).toArray();

    await client.close();

    res.json(userTransactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/userOrderDetails', async (req, res) => {
  try {
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const userOrderDetails = await db.collection('user_details').find({ full_name }).toArray();

    await client.close();

    res.json(userOrderDetails);
  } catch (error) {
    console.error('Error fetching user order details:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Define a route to fetch notes
app.post('/api/notes', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const myColl = db.collection('note');

    const { note, user, date, status } = req.body;

    if (!note || !user || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await myColl.insertOne({ note, user, date, status });

    await client.close();

    console.log('MongoDB Insert Result:', result);

    if (result && result.insertedId) {
      // If the insertion was successful, construct the created note
      const createdNote = { _id: result.insertedId, note, user, date, status };
      return res.json(createdNote);
    } else {
      console.error('Error creating note: InsertedId is undefined or empty');
      return res.status(500).json({ error: 'Internal Server Error', details: 'Failed to create note' });
    }
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

//-----------add new user -------------------
app.post('/api/addUser', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const { name, username, password, status, email, phone, address, country } = req.body;

    if (!name || !username || !password || !status || !email || !phone || !address || !country) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if a user with the same name or username already exists
    const existingUser = await usersCollection.findOne({ $or: [{ full_name: name }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with the same name or username already exists' });
    }

    // Find the last inserted user to get the last ID and add 1
    const lastUser = await usersCollection.find().sort({ id: -1 }).limit(1).toArray();
    let newId = 1; // Default new ID if no users exist
    if (lastUser.length > 0) {
      newId = lastUser[0].id + 1;
    }
    const parsedStatus = parseInt(status);
    const result = await usersCollection.insertOne({
      id: newId,
      full_name: name,
      username,
      password,
      status: parsedStatus,
      email,
      phone,
      address,
      country,
      project: null,
      invoice: null,
      deadline: null,
      budget: null,
      session_id: null,
      img: null
    });

    await client.close();

    if (result && result.insertedId) {
      // If the insertion was successful, construct the created user object
      const createdUser = {
        _id: result.insertedId,
        id: newId,
        full_name: name,
        username,
        password,
        status,
        email,
        phone,
        address,
        country
      };
      return res.json(createdUser);
    } else {
      console.error('Error creating user: InsertedId is undefined or empty');
      return res.status(500).json({ error: 'Internal Server Error', details: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});


//----------- add new user end ---------------

// Define a route to fetch notes based on message, status, or date
app.get('/api/notesSearch', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const notesCollection = db.collection('note');

    const { search } = req.query;

    // Use a regular expression to perform a case-insensitive search
    const query = {
      $or: [
        { note: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { date: { $regex: search, $options: 'i' } },
      ],
    };

    const sort = { _id: 1 }; // Sort by _id field in descending order

    const notes = await notesCollection.find(query).sort(sort).toArray();

    await client.close();

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Add this route to your existing code
app.get('/api/stopServer', (req, res) => {
  // This will stop the server
  res.send('Server is stopping...');
  process.exit();
});



// Routes
app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;