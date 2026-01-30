-- GPS Tracker Database Schema
-- PostgreSQL 13+

-- Create database (run this separately as postgres user)
-- CREATE DATABASE gps_tracker;

-- Connect to the database
-- \c gps_tracker;

-- Create coordinates table
CREATE TABLE IF NOT EXISTS coordinates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT positive_order CHECK (order_index > 0)
);

-- Create index on order_index for faster sorting
CREATE INDEX idx_coordinates_order ON coordinates(order_index);

-- Insert sample data (Budapest landmarks)
INSERT INTO coordinates (name, latitude, longitude, description, order_index) VALUES
    ('Országház', 47.50760000, 19.04580000, 'Hungarian Parliament Building', 1),
    ('Bazilika', 47.50090000, 19.05390000, 'St. Stephen''s Basilica', 2),
    ('Lánchíd', 47.49790000, 19.04370000, 'Chain Bridge', 3),
    ('Budai Vár', 47.49660000, 19.03950000, 'Buda Castle', 4),
    ('Halászbástya', 47.50230000, 19.03450000, 'Fisherman''s Bastion', 5),
    ('Mátyás-templom', 47.50180000, 19.03480000, 'Matthias Church', 6),
    ('Hősök tere', 47.51450000, 19.07750000, 'Heroes'' Square', 7),
    ('Városliget', 47.51550000, 19.08190000, 'City Park', 8),
    ('Széchenyi fürdő', 47.51930000, 19.08160000, 'Széchenyi Thermal Bath', 9),
    ('Vajdahunyad vára', 47.51510000, 19.08220000, 'Vajdahunyad Castle', 10)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_coordinates_updated_at 
    BEFORE UPDATE ON coordinates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Display table info
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'coordinates'
ORDER BY 
    ordinal_position;
