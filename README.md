# GPS Tracker with Real Road Routing

Simple app that connects your GPS points with real roads (using free OSRM routing) and shows accurate distance + travel time.

## Features

* Right-click map to add points
* Drag markers to move them (route updates instantly)
* Edit names/descriptions or delete points
* Blue road-based route appears automatically with 2+ points
* Total distance (km) and estimated time (minutes) shown

## Install & Run

### Requirements

* Node.js (v14+)
* PostgreSQL (running server + created database)

### Steps

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd gps-tracker
```

#### 2. Set up environment variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.sample backend/.env
```

Edit `backend/.env` with your PostgreSQL credentials (see `.env.sample` for required variables).

#### 3. Set up PostgreSQL

* Create a database
* Run database schema:

```bash
psql -U your_username -d your_database -f database/schema.sql
```

#### 4. Backend (Terminal 1)

```bash
cd backend
npm install
node server.js
```

→ Server runs at http://localhost:3001

#### 5. Frontend (Terminal 2)

```bash
cd frontend
npm install
npm start
```

→ Opens at http://localhost:3000

That's it — start adding points and watch the real roads appear! 🚗💨