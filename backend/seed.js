const mongoose = require('mongoose');
const Intersection = require('./models/Intersection');

const MONGODB_URI = 'mongodb://localhost:27017/smart-traffic';

const seedData = async () => {
    await mongoose.connect(MONGODB_URI);
    await Intersection.deleteMany({});

    const intersections = [];
    const names = ['Downtown Hub', 'Sunset Blvd', 'Evergreen Plaza', 'Metro Junction', 'Parkway Cross', 'Industrial Way', 'Dockside', 'Heights Corner', 'Unity Square', 'Central Station', 'Bridge Entrance', 'Airport Link'];

    for (let i = 0; i < names.length; i++) {
        intersections.push({
            id: `INT-${i + 1}`,
            name: names[i],
            status: 'active',
            coordinates: {
                x: (i % 4) * 200 + 100,
                y: Math.floor(i / 4) * 200 + 100
            },
            signalData: {
                currentPhase: i % 2 === 0 ? 'NORTH_SOUTH' : 'EAST_WEST',
                timer: 30
            },
            lanes: [
                { direction: 'NORTH', vehicleCount: 10, density: 0.2 },
                { direction: 'SOUTH', vehicleCount: 12, density: 0.25 },
                { direction: 'EAST', vehicleCount: 8, density: 0.15 },
                { direction: 'WEST', vehicleCount: 15, density: 0.3 }
            ]
        });
    }

    await Intersection.insertMany(intersections);
    console.log('Database seeded with 12 intersections.');
    process.exit();
};

seedData().catch(err => {
    console.error(err);
    process.exit(1);
});
