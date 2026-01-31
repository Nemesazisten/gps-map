import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import axios from 'axios';
import './App.css';

function App() {
  const [coordinates, setCoordinates] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);

  const fetchCoordinates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/coordinates');
      setCoordinates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coordinates: ' + err.message);
      console.error('Error fetching coordinates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const handleSelectPoint = (point) => {
    setSelectedPoint(point);
    setMode('detail');
    setTempMarker(null);
  };

  const handleEdit = () => {
    setMode('edit');
  };

  const handleAddNew = () => {
    setSelectedPoint(null);
    setTempMarker(null);
    setMode('add');
  };

  const handleSave = async (pointData) => {
    try {
      if (mode === 'edit' && selectedPoint) {
        await axios.put(`/api/coordinates/${selectedPoint.id}`, pointData);
      } else if (mode === 'add') {
        await axios.post('/api/coordinates', pointData);
      }
      
      await fetchCoordinates();
      setMode('list');
      setSelectedPoint(null);
      setTempMarker(null);
    } catch (err) {
      setError('Failed to save: ' + err.message);
      console.error('Error saving:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this point?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/coordinates/${id}`);
      await fetchCoordinates();
      setMode('list');
      setSelectedPoint(null);
    } catch (err) {
      setError('Failed to delete: ' + err.message);
      console.error('Error deleting:', err);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setSelectedPoint(null);
    setTempMarker(null);
  };

  const handleMapRightClick = (latlng) => {
    // Round to 4 decimal places for cleaner display
    const roundedLat = parseFloat(latlng.lat.toFixed(4));
    const roundedLng = parseFloat(latlng.lng.toFixed(4));
    
    setTempMarker({
      lat: roundedLat,
      lng: roundedLng
    });
    setSelectedPoint({
      latitude: roundedLat,
      longitude: roundedLng,
      name: latlng.name || '', // Use name from search if available
      description: latlng.fullAddress || '' // Use full address as description if available
    });
    setMode('add');
  };

  const handleMarkerDragEnd = async (id, lat, lng) => {
    try {
      const coord = coordinates.find(c => c.id === id);
      if (!coord) return;
      
      // Round to 4 decimal places
      const roundedLat = parseFloat(lat.toFixed(4));
      const roundedLng = parseFloat(lng.toFixed(4));
      
      await axios.put(`/api/coordinates/${id}`, {
        name: coord.name,
        latitude: roundedLat,
        longitude: roundedLng,
        description: coord.description
      });
      
      await fetchCoordinates();
    } catch (err) {
      setError('Failed to update position: ' + err.message);
      console.error('Error updating position:', err);
    }
  };

  const handleReorder = async (sourceIndex, targetIndex) => {
    try {
      const newCoordinates = [...coordinates];
      const [movedItem] = newCoordinates.splice(sourceIndex, 1);
      newCoordinates.splice(targetIndex, 0, movedItem);
      
      const updatedCoordinates = newCoordinates.map((coord, index) => ({
        ...coord,
        order_index: index + 1
      }));
      setCoordinates(updatedCoordinates);
      
      const updatePromises = newCoordinates.map((coord, index) => {
        const newOrderIndex = index + 1;
        if (coord.order_index !== newOrderIndex) {
          return axios.put(`/api/coordinates/${coord.id}`, {
            name: coord.name,
            latitude: coord.latitude,
            longitude: coord.longitude,
            description: coord.description,
            order_index: newOrderIndex
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
    } catch (err) {
      setError('Failed to reorder: ' + err.message);
      console.error('Error reordering:', err);
      await fetchCoordinates();
    }
  };

  return (
    <div className="App">
      <div className="App-content">
        <Sidebar
          coordinates={coordinates}
          selectedPoint={selectedPoint}
          mode={mode}
          onSelectPoint={handleSelectPoint}
          onEdit={handleEdit}
          onAddNew={handleAddNew}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleCancel}
          onReorder={handleReorder}
          loading={loading}
          error={error}
        />
        
        <MapView
          coordinates={coordinates}
          selectedPoint={selectedPoint}
          tempMarker={tempMarker}
          onSelectPoint={handleSelectPoint}
          onRightClick={handleMapRightClick}
          onMarkerDragEnd={handleMarkerDragEnd}
        />
      </div>
    </div>
  );
}

export default App;
