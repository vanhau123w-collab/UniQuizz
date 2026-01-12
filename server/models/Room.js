// models/Room.js
const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null nếu là guest
  },
  displayName: {
    type: String,
    required: true
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: null // Track socket connection
  },
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    answeredAt: Date,
    timeSpent: Number // milliseconds
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  characterConfig: {
    type: Object,
    default: {} // Stores skin, face, hair, etc.
  }
});

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['auto', 'manual'], // auto: tự động chuyển câu, manual: host điều khiển
    default: 'auto'
  },
  settings: {
    timePerQuestion: {
      type: Number,
      default: 30 // seconds
    },
    showLeaderboardEvery: {
      type: Number,
      default: 5 // Hiện leaderboard sau mỗi X câu (chỉ dùng cho mode auto)
    },
    allowLateJoin: {
      type: Boolean,
      default: true
    }
  },
  participants: [ParticipantSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'paused', 'finished'],
    default: 'waiting'
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique room code
RoomSchema.statics.generateRoomCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await this.findOne({ roomCode: code });
  }
  
  return code;
};

module.exports = mongoose.model('Room', RoomSchema);
