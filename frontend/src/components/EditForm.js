import React, { useState, useEffect } from 'react';

function EditForm({ point, onSave, onCancel, isNew }) {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: ''
  });

  useEffect(() => {
    if (point) {
      setFormData({
        name: point.name || '',
        latitude: point.latitude || '',
        longitude: point.longitude || '',
        description: point.description || ''
      });
    } else {
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        description: ''
      });
    }
  }, [point]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name is required!');
      return;
    }
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Invalid latitude! Must be between -90 and 90');
      return;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      alert('Invalid longitude! Must be between -180 and 180');
      return;
    }
    
    onSave({
      name: formData.name.trim(),
      latitude: lat,
      longitude: lng,
      description: formData.description.trim()
    });
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h3>{isNew ? 'Add New Point' : 'Edit Point'}</h3>
      
      {isNew && point && point.latitude && (
        <div style={{ 
          padding: '0.75rem', 
          background: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <strong>📍 Coordinates from map {point.name ? 'search' : 'click'}:</strong><br />
          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            {parseFloat(point.latitude).toFixed(4)}, {parseFloat(point.longitude).toFixed(4)}
          </span>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Parliament Building"
          required
          autoFocus
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="latitude">Latitude *</label>
        <input
          type="number"
          id="latitude"
          name="latitude"
          value={formData.latitude}
          onChange={handleChange}
          step="0.00000001"
          min="-90"
          max="90"
          placeholder="47.4979"
          required
        />
        <small>Between -90 and 90</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="longitude">Longitude *</label>
        <input
          type="number"
          id="longitude"
          name="longitude"
          value={formData.longitude}
          onChange={handleChange}
          step="0.00000001"
          min="-180"
          max="180"
          placeholder="19.0402"
          required
        />
        <small>Between -180 and 180</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description..."
        />
      </div>
      
      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-success">
          Save
        </button>
      </div>
    </form>
  );
}

export default EditForm;
