-- PostgreSQL schema for AI-Based Smart Traffic Management System

CREATE TABLE IF NOT EXISTS intersections (
    id VARCHAR(32) PRIMARY KEY,
    name TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lanes (
    id SERIAL PRIMARY KEY,
    intersection_id VARCHAR(32) REFERENCES intersections(id) ON DELETE CASCADE,
    lane_id VARCHAR(8) NOT NULL,
    direction VARCHAR(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS traffic_snapshots (
    id BIGSERIAL PRIMARY KEY,
    intersection_id VARCHAR(32) REFERENCES intersections(id) ON DELETE CASCADE,
    lane_id VARCHAR(8) NOT NULL,
    vehicle_count INTEGER NOT NULL,
    density VARCHAR(16) NOT NULL,
    signal_color VARCHAR(8) NOT NULL,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_time
    ON traffic_snapshots (snapshot_time);

CREATE TABLE IF NOT EXISTS signal_logs (
    id BIGSERIAL PRIMARY KEY,
    intersection_id VARCHAR(32) REFERENCES intersections(id) ON DELETE CASCADE,
    lane_id VARCHAR(8) NOT NULL,
    previous_color VARCHAR(8),
    new_color VARCHAR(8) NOT NULL,
    reason TEXT NOT NULL, -- e.g. 'adaptive_timing', 'emergency_override'
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
    id BIGSERIAL PRIMARY KEY,
    intersection_id VARCHAR(32) REFERENCES intersections(id) ON DELETE CASCADE,
    level VARCHAR(16) NOT NULL, -- INFO / WARNING / CRITICAL
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    intersection_id VARCHAR(32) REFERENCES intersections(id) ON DELETE CASCADE,
    lane_id VARCHAR(8) NOT NULL,
    vehicle_type VARCHAR(32) NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Example seed data for a 3x4 grid (12 intersections)
INSERT INTO intersections (id, name, x, y) VALUES
    ('I1', 'Intersection I1', 0, 0),
    ('I2', 'Intersection I2', 1, 0),
    ('I3', 'Intersection I3', 2, 0),
    ('I4', 'Intersection I4', 3, 0),
    ('I5', 'Intersection I5', 0, 1),
    ('I6', 'Intersection I6', 1, 1),
    ('I7', 'Intersection I7', 2, 1),
    ('I8', 'Intersection I8', 3, 1),
    ('I9', 'Intersection I9', 0, 2),
    ('I10', 'Intersection I10', 1, 2),
    ('I11', 'Intersection I11', 2, 2),
    ('I12', 'Intersection I12', 3, 2)
ON CONFLICT (id) DO NOTHING;

