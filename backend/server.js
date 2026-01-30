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
