var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser'); // Import body-parser
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');  // Ensure ObjectId is imported
const multer = require('multer');
const upload = multer(); // Initialize multer middleware
const fs = require('fs');

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
//const mongoURI = 'mongodb://localhost:27017/';
//const mongoURI = 'mongodb://arshadthedeveloper:ijgzSNj1Cr2z0NC3@0127.0.0.1:27017/?authSource=admin';
const mongoURI = 'mongodb+srv://arshadthedeveloper:ijgzSNj1Cr2z0NC3@cluster0.7pgip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'bizmis_db';

const profileImageDir = path.join(__dirname, '../styles/profile');


//require Files
const messages = require('./models/messagesSchema');
const { connectToDatabase, closeDatabaseConnection } = require('./utils/db'); // Import the utility module
const Message = require('./models/messagesSchema');
const Conversation = require('./models/convercationSchema');


app.post('/api/login', async(req, res) => {
  const { fullName, password } = req.body;

  console.log(req.body);

  const db = await connectToDatabase(); // Reuse connection

  const collection = db.collection('users');
  
  const user = await collection.findOne({ fullName, password });;
  console.log(user);
  

  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false, message: 'Invalid username or password' });
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
  try {
    const db = await connectToDatabase(); // Reuse connection

    const { sender, receiver, date, time, chat } = req.body;

    // Validate required fields
    if (!sender || !receiver || !date || !time || !chat) {
      return res.status(400).json({ error: 'All fields except image are required.' });
    }

    // Check if a conversation exists for the sender and receiver
    let conversation = await db.collection('conversations').findOne({ participants: { $all: [sender, receiver] } });

    if (!conversation) {
      // Create a new conversation if it doesn't exist
      const lastConversation = await db.collection('conversations').findOne({}, { sort: { conversation_id: -1 } });
      const newConversationId = (lastConversation ? lastConversation.conversation_id : 0) + 1;

      conversation = new Conversation({
        conversation_id: newConversationId,
        participants: [sender, receiver],
      });

      await db.collection('conversations').insertOne(conversation);
    }

    // Fetch the last message to get the latest message_id
    const lastMessage = await db.collection('messages').findOne({}, { sort: { message_id: -1 } });

    // Calculate the new message_id
    const newMessageId = (lastMessage ? lastMessage.message_id : 0) + 1;

    // Create a new message document
    const newMessage = new Message({
      message_id: newMessageId,
      conversation_id: conversation.conversation_id,
      sender,
      receiver,
      date,
      time,
      chat,
      status: "1", // Status should always be "1"
    });

    // Save the message to the database
    //const savedMessage = await newMessage.save();

    const savedMessage = await db.collection('messages').insertOne(newMessage);

    await closeDatabaseConnection();

    res.status(201).json({
      message: 'Message sent successfully',
      data: savedMessage,
      conversation_id: conversation.conversation_id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get messages for a specific conversation
app.get('/api/getMessage/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  //console.log(conversationId,'===>conversationId');

  if (!conversationId) return res.status(200).json([]);
  try {
    // Reuse the existing database connection
    const db = await connectToDatabase();

    // Fetch messages for the given conversation_id
    const messages = await db.collection('messages').find({ conversation_id: parseInt(conversationId) }).toArray(); // Convert conversationId to integer if needed

    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this conversation.' });
    }

    // Close the database connection (if not using persistent connection)
    await closeDatabaseConnection();

    // Return the messages for the conversation
    res.status(200).json({
      message: 'Messages retrieved successfully',
      data: messages,
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Get conversations for a specific user
app.get('/api/conversation/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Reuse the existing database connection
    const db = await connectToDatabase();

    // Find conversations where the user is a participant
    const conversations = await db.collection('conversations').find({
      participants: userId
    }).toArray(); // Convert to array for easy handling   
    

    // Add user details to each conversation
    const conversationsWithUserDetails = await Promise.all(conversations.map(async (conversation) => {
      // Filter out userId from participants

      const participants = conversation.participants.filter(participant => participant !== userId);

     // Fetch messages for the given conversation_id
     const messages = await db.collection('messages').find({ conversation_id: parseInt(conversation.conversation_id) }).toArray(); // Convert conversationId to integer if needed


      // Fetch user details for each participant
      const participantsWithDetails = await Promise.all(participants.map(async (participantId) => {

        const participantDetails = await db.collection('users').findOne({ _id: new ObjectId(participantId) });
        return participantDetails;
      }));

      // Return the conversation with the participant details
      return { ...conversation, participantsWithDetails ,messages};
    }));



    // If no conversations are found, send an appropriate message
    if (conversations.length === 0) {
      return res.status(200).json({ message: 'No conversations found for this user.' });
    }

    // Close the database connection (if not using persistent connection)
    await closeDatabaseConnection();

    // Return the list of conversations
    res.status(200).json({
      message: 'Conversations retrieved successfully',
      data: conversationsWithUserDetails,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get conversations for a specific user
app.post('/api/conversation', async (req, res) => {
  const { senderId, receiverId } = req.body; // Receive both sender and receiver from request body

  try {
    // Reuse the existing database connection
    const db = await connectToDatabase();

    // Find conversations where both sender and receiver are participants
    const conversations = await db.collection('conversations').find({
      participants: { $all: [senderId, receiverId] } // Ensures both users are in the conversation
    }).toArray();

    console.log('conversations=>>>>',conversations);
    

    // If no conversations are found, send an appropriate message
    if (conversations.length === 0) {
      return res.status(200).json({ message: false });
    }

    // Add user details and messages to each conversation
    const conversationsWithDetails = await Promise.all(conversations.map(async (conversation) => {
      const participants = conversation.participants.filter(participant => participant !== senderId );

      console.log('conversation', conversation.conversation_id);
      

      // Fetch messages for the given conversation
      const messages = await db.collection('messages').find({ conversation_id: parseInt(conversation.conversation_id) }).toArray();

      console.log('messages====>',messages);
      

      // Fetch user details for each participant
      const participantsWithDetails = await Promise.all(participants.map(async (participantId) => {
        return await db.collection('users').findOne({ _id: new ObjectId(participantId) });
      }));

      return { ...conversation, participantsWithDetails, messages };
    }));

    // Close the database connection (if not using persistent connection)
    await closeDatabaseConnection();

    // Return the list of conversations
    res.status(200).json({
      message: true,
      data: conversationsWithDetails,
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