/**
 * AI Logic for Smart Traffic Control
 * Optimizes signal duration based on current lane density.
 */

const optimizeSignal = (intersection) => {
    const { lanes, signalData } = intersection;
    
    // Find density for each direction
    const nsDensity = lanes.filter(l => l.direction.startsWith('N') || l.direction.startsWith('S'))
                           .reduce((acc, l) => acc + l.density, 0) / 2;
    const ewDensity = lanes.filter(l => l.direction.startsWith('E') || l.direction.startsWith('W'))
                           .reduce((acc, l) => acc + l.density, 0) / 2;

    const currentPhase = signalData.currentPhase;
    let recommendation = { ...signalData.recommendation };

    // Simple rule-based logic:
    // If the other direction has high density and current has low, suggest phase change.
    // If current has very high density, suggest extending current green time.
    
    if (currentPhase === 'NORTH_SOUTH') {
        if (ewDensity > nsDensity + 0.3) {
            recommendation = {
                phase: 'EAST_WEST',
                duration: 30 + (ewDensity * 20),
                reason: 'High congestion on East-West lanes'
            };
        } else {
            recommendation = {
                phase: 'NORTH_SOUTH',
                duration: 30 + (nsDensity * 20),
                reason: 'Optimal flow'
            };
        }
    } else {
        if (nsDensity > ewDensity + 0.3) {
            recommendation = {
                phase: 'NORTH_SOUTH',
                duration: 30 + (nsDensity * 20),
                reason: 'High congestion on North-South lanes'
            };
        } else {
            recommendation = {
                phase: 'EAST_WEST',
                duration: 30 + (ewDensity * 20),
                reason: 'Optimal flow'
            };
        }
    }

    return recommendation;
};

module.exports = { optimizeSignal };
