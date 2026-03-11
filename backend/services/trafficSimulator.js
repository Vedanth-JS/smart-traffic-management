const Intersection = require('../models/Intersection');
const { optimizeSignal } = require('../controllers/aiController');

const simulateTraffic = async (io) => {
    try {
        const intersections = await Intersection.find();
        
        for (let intersection of intersections) {
            // Simulate random traffic fluctuations
            intersection.lanes = intersection.lanes.map(lane => {
                const change = (Math.random() - 0.4) * 0.1; // Bias towards slight increase
                lane.density = Math.max(0.1, Math.min(1.0, lane.density + change));
                lane.vehicleCount = Math.floor(lane.density * 50);
                return lane;
            });

            // Get AI recommendation
            const aiRecommendation = optimizeSignal(intersection);
            intersection.signalData.recommendation = aiRecommendation;

            // Simple auto-signal flip for demo if timer reaches 0
            intersection.signalData.timer -= 5;
            if (intersection.signalData.timer <= 0) {
                intersection.signalData.currentPhase = (intersection.signalData.currentPhase === 'NORTH_SOUTH') ? 'EAST_WEST' : 'NORTH_SOUTH';
                intersection.signalData.timer = aiRecommendation.duration || 30;
            }

            await intersection.save();
        }

        // Broadcast updates to all clients
        const updatedIntersections = await Intersection.find();
        io.emit('trafficData', updatedIntersections);
        
    } catch (err) {
        console.error('Simulation Error:', err);
    }
};

module.exports = { simulateTraffic };
