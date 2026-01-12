const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Tự động xóa sau 10 phút (600 giây)
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

// Index để tìm kiếm nhanh
EmailVerificationSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);
