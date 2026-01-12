const mongoose = require('mongoose');

// Schema cho một flashcard (không phải là model riêng)
const flashcardSchema = new mongoose.Schema(
  { front: String, back: String, hint: String, tags: [String] },
  { _id: false }
);

// Schema cho một bộ flashcard
const flashcardSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseCode: { type: String },
    flashcards: { type: [flashcardSchema], default: [] },

    // ⭐️⭐️ BẠN CẦN THÊM TRƯỜNG NÀY VÀO ⭐️⭐️
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false, // Mặc định là private
    }
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

const FlashcardSet = mongoose.models.FlashcardSet || mongoose.model('FlashcardSet', flashcardSetSchema);

module.exports = FlashcardSet;