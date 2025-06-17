// db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB configuration
;

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

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
    console.log(mongoURI);
    
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
