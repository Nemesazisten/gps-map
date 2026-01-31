import React, { useState } from 'react';

function CoordinateList({ coordinates, selectedPoint, onSelectPoint, onReorder }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  if (coordinates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
        No coordinates yet. Add a new point to get started!
      </div>
    );
  }

  const handleDragStart = (e, coord) => {
    setDraggedItem(coord);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, coord) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && coord.id !== draggedItem.id) {
      setDragOverItem(coord);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetCoord) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetCoord.id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const sourceIndex = coordinates.findIndex(c => c.id === draggedItem.id);
    const targetIndex = coordinates.findIndex(c => c.id === targetCoord.id);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      onReorder(sourceIndex, targetIndex);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <ul className="coordinate-list">
      {coordinates.map((coord) => (
        <li
          key={coord.id}
          className={`coordinate-item ${
            selectedPoint && selectedPoint.id === coord.id ? 'selected' : ''
          } ${dragOverItem && dragOverItem.id === coord.id ? 'drag-over' : ''}`}
          onClick={() => onSelectPoint(coord)}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, coord)}
          onDragOver={(e) => handleDragOver(e, coord)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, coord)}
          onDragEnd={handleDragEnd}
          style={{ cursor: 'move' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', color: '#6c757d' }}>⋮⋮</span>
            <div style={{ flex: 1 }}>
              <h3>#{coord.order_index} {coord.name}</h3>
              <p>
                {parseFloat(coord.latitude).toFixed(4)}, {parseFloat(coord.longitude).toFixed(4)}
              </p>
              {coord.description && (
                <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                  {coord.description.substring(0, 60)}
                  {coord.description.length > 60 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default CoordinateList;
