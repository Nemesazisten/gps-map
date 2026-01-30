-- GPS Coordinates Table 
CREATE TABLE IF NOT EXISTS coordinates ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT NOT NULL, 
  latitude REAL NOT NULL, 
  longitude REAL NOT NULL 
); 
