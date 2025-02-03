const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversation_id: {
    type: Number,
    required: true,
    unique: true,
  },
  participants: {
    type: [String], // Array of sender and receiver IDs
    required: true,
    validate: [arrayLimit, 'A conversation must have exactly 2 participants.'],
  },
});

function arrayLimit(val) {
  return val.length === 2;
}

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
