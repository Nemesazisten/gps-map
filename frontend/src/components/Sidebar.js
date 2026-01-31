import React from 'react';
import CoordinateList from './CoordinateList';
import DetailView from './DetailView';
import EditForm from './EditForm';

function Sidebar({
  coordinates,
  selectedPoint,
  mode,
  onSelectPoint,
  onEdit,
  onAddNew,
  onSave,
  onDelete,
  onCancel,
  onReorder,
  loading,
  error
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Coordinates</h2>
        <button className="add-button" onClick={onAddNew}>
          + Add New Point
        </button>
      </div>
      
      <div className="sidebar-content">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && (
          <>
            {mode === 'list' && (
              <CoordinateList
                coordinates={coordinates}
                selectedPoint={selectedPoint}
                onSelectPoint={onSelectPoint}
                onReorder={onReorder}
              />
            )}
            
            {mode === 'detail' && selectedPoint && (
              <DetailView
                point={selectedPoint}
                onEdit={onEdit}
                onDelete={onDelete}
                onBack={onCancel}
              />
            )}
            
            {(mode === 'edit' || mode === 'add') && (
              <EditForm
                point={selectedPoint}
                onSave={onSave}
                onCancel={onCancel}
                isNew={mode === 'add'}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
