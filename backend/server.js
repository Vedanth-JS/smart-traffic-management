require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
// const mongoose = require('mongoose');
const cors = require('cors');

// Mock Data Store
let intersections = [];

// const Intersection = require('./models/Intersection');
const { simulateTraffic } = require('./services/trafficSimulator');

let simulationIntersections = intersections; // Reference for the simulator

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Database Connection (Disabled for local reliability, using in-memory)
console.log('Using in-memory data store for demo');

// Initial seed
const names = ['Downtown Hub', 'Sunset Blvd', 'Evergreen Plaza', 'Metro Junction', 'Parkway Cross', 'Industrial Way', 'Dockside', 'Heights Corner', 'Unity Square', 'Central Station', 'Bridge Entrance', 'Airport Link'];
for (let i = 0; i < names.length; i++) {
    intersections.push({
        id: `INT-${i + 1}`,
        name: names[i],
        status: 'active',
        coordinates: { x: (i % 4) * 200 + 100, y: Math.floor(i / 4) * 200 + 100 },
        signalData: { currentPhase: i % 2 === 0 ? 'NORTH_SOUTH' : 'EAST_WEST', timer: 30, recommendation: {} },
        lanes: [
            { direction: 'NORTH', vehicleCount: 10, density: 0.2 },
            { direction: 'SOUTH', vehicleCount: 12, density: 0.25 },
            { direction: 'EAST', vehicleCount: 8, density: 0.15 },
            { direction: 'WEST', vehicleCount: 15, density: 0.3 }
        ]
    });
}

// API Routes
app.get('/api/intersections', async (req, res) => {
    res.json(intersections);
});

app.post('/api/signal-update', async (req, res) => {
    const { intersectionId, phase, duration } = req.body;
    const intersection = intersections.find(i => i.id === intersectionId);
    if (intersection) {
        intersection.signalData.currentPhase = phase;
        intersection.signalData.timer = duration;
        intersection.status = 'override';
        io.emit('trafficData', intersections);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Intersection not found' });
    }
});

app.get('/api/traffic-stats', async (req, res) => {
    const stats = intersections.map(i => ({
        name: i.name,
        avgDensity: i.lanes.reduce((acc, l) => acc + l.density, 0) / i.lanes.length,
        totalVehicles: i.lanes.reduce((acc, l) => acc + l.vehicleCount, 0)
    }));
    res.json(stats);
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected'));
});

// Start Simulation Loop (every 5 seconds)
setInterval(async () => {
    intersections = await simulateTraffic(io, intersections);
}, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
