// server/models/voice.js
const mongoose = require('mongoose');

const VoiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    engine: {
        type: String,
        enum: ['web-speech', 'google-translate', 'google-cloud'],
        default: 'web-speech'
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'female'
    },
    language: {
        type: String,
        default: 'vi'
    },
    voiceName: {
        type: String,
        default: ''
    },
    rate: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0
    },
    pitch: {
        type: Number,
        default: 1.0
    },
    volume: {
        type: Number,
        default: 1.0,
        min: 0.0,
        max: 1.0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

VoiceSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Voice', VoiceSchema);