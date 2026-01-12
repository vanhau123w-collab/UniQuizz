// server/models/Lecture.js
const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    sections: [{
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    }],
    sourceFile: {
        name: String,
        fileType: String,
        size: Number
    },
    metadata: {
        totalSections: Number,
        estimatedDuration: Number, // phút
        language: {
            type: String,
            default: 'vi'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    accessCount: {
        type: Number,
        default: 0
    }
});

// Index để tìm kiếm nhanh
LectureSchema.index({ userId: 1, createdAt: -1 });
LectureSchema.index({ title: 'text' });

// Middleware để cập nhật lastAccessedAt
LectureSchema.methods.markAccessed = function() {
    this.lastAccessedAt = Date.now();
    this.accessCount += 1;
    return this.save();
};

module.exports = mongoose.model('Lecture', LectureSchema);
