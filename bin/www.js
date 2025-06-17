const https = require('https');
const fs = require('fs');
const debug = require('debug')('server:server');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors'); 
const SocketIO = require('socket.io');
const app = require('../app');
const http = require('http');
require('dotenv').config();
// MongoDB connection details


const mongoURI = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;



// Enable CORS for all routes
app.use(cors());

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '1234');
app.set('port', port);

/**
 * Create HTTPS server with SSL certificates.
 */
/*
const server = https.createServer(
  {
    cert: fs.readFileSync('../cert.pem'), // SSL Certificate
    key: fs.readFileSync('../key.pem'),  // SSL Private Key
  },
  app
); */

const server = http.createServer(app);

// Set up Socket.IO with HTTPS server
const io = SocketIO(server, {
  cors: {
   
    origin: (origin, callback) => {
      if (origin === 'http://localhost/bizencyProject/public/printpace' || origin === 'http://localhost:3000' 
        || origin === 'http://192.168.1.6:3000' 
      ) {
        callback(null, true); // Allow the request from both origins
      } else {
        callback(new Error('Not allowed by CORS')); // Reject the request from other origins
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true,
  },
});

// MongoDB connection
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }

  const db = client.db(dbName);
  console.log('Connected to MongoDB');

  // Pass MongoDB database instance to the app
  app.set('mongoDB', db);

  // Initialize Socket.IO
  require('../sockets/index')(io);
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val; // named pipe
  }
  if (port >= 0) {
    return port; // port number
  }
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // Handle specific listen errors
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
  debug('Listening on ' + bind);
}
