const { optimizeSignal } = require('../controllers/aiController');

const simulateTraffic = async (io, intersections) => {
    try {
        const updated = intersections.map(intersection => {
            // Simulate random traffic fluctuations
            intersection.lanes = intersection.lanes.map(lane => {
                const change = (Math.random() - 0.4) * 0.1;
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
                intersection.signalData.timer = Math.round(aiRecommendation.duration || 30);
            }

            return intersection;
        });

        // Broadcast updates to all clients
        io.emit('trafficData', updated);
        return updated;
        
    } catch (err) {
        console.error('Simulation Error:', err);
        return intersections;
    }
};

module.exports = { simulateTraffic };
