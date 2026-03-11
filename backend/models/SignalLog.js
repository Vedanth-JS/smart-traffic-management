const mongoose = require('mongoose');

const SignalLogSchema = new mongoose.Schema({
    intersectionId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    previousPhase: String,
    newPhase: String,
    duration: Number,
    triggeredBy: { type: String, enum: ['AI', 'MANUAL', 'SYSTEM'], default: 'AI' },
    reason: String
});

module.exports = mongoose.model('SignalLog', SignalLogSchema);
