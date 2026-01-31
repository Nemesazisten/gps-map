import React from 'react';

function DetailView({ point, onEdit, onDelete, onBack }) {
  return (
    <div className="detail-view">
      <h3>{point.name}</h3>
      
      <div className="detail-field">
        <label>Latitude</label>
        <div className="value">{parseFloat(point.latitude).toFixed(4)}</div>
      </div>
      
      <div className="detail-field">
        <label>Longitude</label>
        <div className="value">{parseFloat(point.longitude).toFixed(4)}</div>
      </div>
      
      {point.description && (
        <div className="detail-field">
          <label>Description</label>
          <div className="value">{point.description}</div>
        </div>
      )}
      
      <div className="detail-field">
        <label>Order</label>
        <div className="value">#{point.order_index}</div>
      </div>
      
      <div className="detail-field">
        <label>Created</label>
        <div className="value">
          {new Date(point.created_at).toLocaleString('en-US')}
        </div>
      </div>
      
      {point.updated_at && point.updated_at !== point.created_at && (
        <div className="detail-field">
          <label>Last Modified</label>
          <div className="value">
            {new Date(point.updated_at).toLocaleString('en-US')}
          </div>
        </div>
      )}
      
      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(point.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default DetailView;
