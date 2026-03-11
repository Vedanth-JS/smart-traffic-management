require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const Intersection = require('./models/Intersection');
const { simulateTraffic } = require('./services/trafficSimulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-traffic';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Routes
app.get('/api/intersections', async (req, res) => {
    const intersections = await Intersection.find();
    res.json(intersections);
});

app.post('/api/signal-update', async (req, res) => {
    const { intersectionId, phase, duration } = req.body;
    const intersection = await Intersection.findOne({ id: intersectionId });
    if (intersection) {
        intersection.signalData.currentPhase = phase;
        intersection.signalData.timer = duration;
        intersection.status = 'override';
        await intersection.save();
        io.emit('trafficData', await Intersection.find());
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Intersection not found' });
    }
});

app.get('/api/traffic-stats', async (req, res) => {
    // Basic stats for charts
    const intersections = await Intersection.find();
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
setInterval(() => simulateTraffic(io), 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
