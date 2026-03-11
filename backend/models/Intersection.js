const mongoose = require('mongoose');

const IntersectionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'maintenance', 'override'], default: 'active' },
    coordinates: {
        x: Number,
        y: Number
    },
    signalData: {
        currentPhase: { type: String, enum: ['NORTH_SOUTH', 'EAST_WEST'], default: 'NORTH_SOUTH' },
        timer: { type: Number, default: 30 },
        recommendation: {
            phase: String,
            duration: Number,
            reason: String
        }
    },
    lanes: [{
        direction: String,
        vehicleCount: { type: Number, default: 0 },
        density: { type: Number, default: 0 } // 0 to 1
    }]
}, { timestamps: true });

module.exports = mongoose.model('Intersection', IntersectionSchema);
