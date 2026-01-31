import React from 'react'; 
import { MapContainer, TileLayer } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css'; 
 
function MapView() { 
  return ( 
    <MapContainer 
      center={[0, 0]} 
      zoom={2} 
      style={{ height: '100%', width: '100%' }} 
    > 
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> 
    </MapContainer> 
  ); 
} 
 
export default MapView; 
