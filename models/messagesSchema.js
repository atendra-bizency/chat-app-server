const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  conversation_id: {
    type: Number,
    required: true, // Reference to the conversation
  },
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  chat: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "1",
  },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
