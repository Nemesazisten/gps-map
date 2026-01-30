const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// GET all coordinates (ordered)
app.get('/api/coordinates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coordinates ORDER BY order_index ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});

// GET single coordinate by ID
app.get('/api/coordinates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM coordinates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinate not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching coordinate:', error);
    res.status(500).json({ error: 'Failed to fetch coordinate' });
  }
});

// POST new coordinate
app.post('/api/coordinates', async (req, res) => {
  try {
    const { name, latitude, longitude, description } = req.body;
    
    // Validate input
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }
    
    // Get max order_index and increment
    const maxOrderResult = await pool.query(
      'SELECT COALESCE(MAX(order_index), 0) as max_order FROM coordinates'
    );
    const newOrder = maxOrderResult.rows[0].max_order + 1;
    
    const result = await pool.query(
      'INSERT INTO coordinates (name, latitude, longitude, description, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, latitude, longitude, description || null, newOrder]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating coordinate:', error);
    res.status(500).json({ error: 'Failed to create coordinate' });
  }
});

// PUT update coordinate
app.put('/api/coordinates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, description, order_index } = req.body;
    
    // Validate input
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }
    
    // If order_index is provided, update it; otherwise keep current
    let query, params;
    if (order_index !== undefined) {
      query = 'UPDATE coordinates SET name = $1, latitude = $2, longitude = $3, description = $4, order_index = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *';
      params = [name, latitude, longitude, description || null, order_index, id];
    } else {
      query = 'UPDATE coordinates SET name = $1, latitude = $2, longitude = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *';
      params = [name, latitude, longitude, description || null, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinate not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating coordinate:', error);
    res.status(500).json({ error: 'Failed to update coordinate' });
  }
});

// DELETE coordinate
app.delete('/api/coordinates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM coordinates WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinate not found' });
    }
    
    // Reorder remaining coordinates
    await pool.query(
      'UPDATE coordinates SET order_index = order_index - 1 WHERE order_index > $1',
      [result.rows[0].order_index]
    );
    
    res.json({ message: 'Coordinate deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting coordinate:', error);
    res.status(500).json({ error: 'Failed to delete coordinate' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/coordinates`);
});

module.exports = app;
