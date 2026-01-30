const pool = require('./db');

const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating coordinates table...');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coordinates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Table created successfully');
    
    // Check if data already exists
    const checkResult = await client.query('SELECT COUNT(*) FROM coordinates');
    const count = parseInt(checkResult.rows[0].count);
    
    if (count === 0) {
      console.log('Inserting sample data...');
      
      // Sample route: Budapest landmarks
      const sampleData = [
        { name: 'Országház', lat: 47.5076, lng: 19.0458, desc: 'Hungarian Parliament Building', order: 1 },
        { name: 'Bazilika', lat: 47.5009, lng: 19.0539, desc: "St. Stephen's Basilica", order: 2 },
        { name: 'Lánchíd', lat: 47.4979, lng: 19.0437, desc: 'Chain Bridge', order: 3 },
        { name: 'Budai Vár', lat: 47.4966, lng: 19.0395, desc: 'Buda Castle', order: 4 },
        { name: 'Halászbástya', lat: 47.5023, lng: 19.0345, desc: "Fisherman's Bastion", order: 5 },
        { name: 'Mátyás-templom', lat: 47.5018, lng: 19.0348, desc: 'Matthias Church', order: 6 },
        { name: 'Hősök tere', lat: 47.5145, lng: 19.0775, desc: "Heroes' Square", order: 7 },
        { name: 'Városliget', lat: 47.5155, lng: 19.0819, desc: 'City Park', order: 8 },
        { name: 'Széchenyi fürdő', lat: 47.5193, lng: 19.0816, desc: 'Széchenyi Thermal Bath', order: 9 },
        { name: 'Vajdahunyad vára', lat: 47.5151, lng: 19.0822, desc: 'Vajdahunyad Castle', order: 10 }
      ];
      
      for (const point of sampleData) {
        await client.query(
          'INSERT INTO coordinates (name, latitude, longitude, description, order_index) VALUES ($1, $2, $3, $4, $5)',
          [point.name, point.lat, point.lng, point.desc, point.order]
        );
      }
      
      console.log(`Inserted ${sampleData.length} sample coordinates`);
    } else {
      console.log(`Database already contains ${count} coordinates`);
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
