const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    type: { type: String, required: true }, // congestion, accident, road_closure
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    intersectionId: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', IncidentSchema);
