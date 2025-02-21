// db.js
const { MongoClient } = require('mongodb');

// MongoDB configuration
const mongoURI = 'mongodb+srv://arshadthedeveloper:ijgzSNj1Cr2z0NC3@cluster0.7pgip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'bizmis_db';

let client;
let db;
/*
// Function to connect to MongoDB
const connectToDatabase = async () => {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  }
  return db;
}; */


const connectToDatabase = async () => {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  }
  return { client, db };  // Return both client and db
};


// Function to close the connection (optional)
const closeDatabaseConnection = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    console.log('MongoDB connection closed');
  }
};

module.exports = { connectToDatabase, closeDatabaseConnection };
