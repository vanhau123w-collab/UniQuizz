// server/models/Topic.js
const mongoose = require('mongoose');

// Cấu trúc cho 1 từ vựng (Word)
const WordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  definition: { type: String, required: true },
  example: { type: String, required: true },
});

// Cấu trúc cho 1 Chủ đề (Topic)
const TopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  words: [WordSchema],
  isSystem: { type: Boolean, default: false }, // true = 6 chủ đề gốc

  // Liên kết với User model của bạn
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: function() { return !this.isSystem; } // Bắt buộc nếu không phải system topic
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Topic', TopicSchema);