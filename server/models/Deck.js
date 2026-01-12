// models/Deck.js
const mongoose = require('mongoose');

// Đây là cấu trúc cho 1 câu hỏi
const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Mảng các chuỗi [A, B, C, D]
    required: true,
  },
  answer: {
    type: String, // Đáp án đúng (ví dụ: "A")
    required: true,
  },
});

// Đây là cấu trúc cho 1 bộ quiz
const DeckSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    default: 'GENERAL',
  },
  summary: {
    type: [String], // Mảng các gạch đầu dòng tóm tắt
  },
  questions: [QuestionSchema], // Mảng các câu hỏi (dùng schema ở trên)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false, // Mặc định là private
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Deck', DeckSchema);