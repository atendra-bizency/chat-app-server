const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  team: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  currentChatId: { type: Number, default: null },
  lastActivity: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agent', agentSchema);
