import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { createPortal } from 'react-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Patch Leaflet Routing Machine to prevent null reference errors
// This fixes the "Cannot read properties of null (reading 'removeLayer')" error
if (typeof window !== 'undefined' && L.Routing) {
  const originalOnAdd = L.Routing.Control.prototype.onAdd;
  L.Routing.Control.prototype.onAdd = function(map) {
    try {
      return originalOnAdd.call(this, map);
    } catch (error) {
      console.warn('Routing control initialization warning:', error);
      return L.DomUtil.create('div');
    }
  };

  const originalOnRemove = L.Routing.Control.prototype.onRemove;
  L.Routing.Control.prototype.onRemove = function(map) {
    try {
      if (originalOnRemove) {
        return originalOnRemove.call(this, map);
      }
    } catch (error) {
      console.warn('Routing control removal warning:', error);
    }
  };
}

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const tempIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Pure React Search Component
function SearchBox({ onSelectLocation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const displayName = result.display_name.split(',')[0];
    const fullAddress = result.display_name;
    
    onSelectLocation({
      lat,
      lng,
      name: displayName,
      fullAddress: fullAddress,
      shouldZoom: true // Add flag to trigger zoom
    });
    
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div ref={searchBoxRef} style={{ width: '380px' }}>
      <div style={{
        position: 'relative',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          background: 'white'
        }}>
          <svg style={{ width: '20px', height: '20px', color: '#5f6368', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search location"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            style={{
              flex: 1,
              padding: '14px 12px',
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              background: 'transparent'
            }}
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: '#5f6368',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.target.style.background = '#f1f3f4'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {showResults && (isSearching || searchResults.length > 0) && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {isSearching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#5f6368', fontSize: '14px' }}>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #4285f4',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result, index) => {
              const parts = result.display_name.split(',');
              const mainText = parts[0];
              const secondaryText = parts.slice(1).join(',').trim();
              
              return (
                <div
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <svg style={{ width: '20px', height: '20px', color: '#5f6368', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#202124',
                      fontWeight: 400,
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{mainText}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#5f6368',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{secondaryText}</div>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      )}
    </div>
  );
}

function SearchControl({ onSelectLocation }) {
  const map = useMap();
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const div = L.DomUtil.create('div', 'search-control-container');
    div.style.position = 'absolute';
    div.style.top = '100px';
    div.style.left = '10px';
    div.style.zIndex = '1000';
    
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    
    map.getContainer().appendChild(div);
    setContainer(div);

    return () => {
      if (map.getContainer().contains(div)) {
        map.getContainer().removeChild(div);
      }
      setContainer(null);
    };
  }, [map]);

  return container ? createPortal(
    <SearchBox onSelectLocation={onSelectLocation} />,
    container
  ) : null;
}

function MapBounds({ coordinates }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = coordinates.map(coord => [
        parseFloat(coord.latitude),
        parseFloat(coord.longitude)
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

function ZoomToLocation({ location }) {
  const map = useMap();
  
  useEffect(() => {
    if (location && location.shouldZoom) {
      map.setView([location.lat, location.lng], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [location, map]);
  
  return null;
}

function MapRightClickHandler({ onRightClick }) {
  useMapEvents({
    contextmenu: (e) => {
      onRightClick(e.latlng);
    }
  });
  
  return null;
}

function RoutingMachine({ coordinates }) {
  const map = useMap();
  const routingControlRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const highlightMarkerRef = useRef(null);
  const isMountedRef = useRef(false);
  const initTimeoutRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    
    isMountedRef.current = true;

    // Clear any pending initialization
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    // Clean up previous routing control
    if (routingControlRef.current) {
      try {
        // Safely remove the control
        if (map && map.hasControl && map.hasControl(routingControlRef.current)) {
          map.removeControl(routingControlRef.current);
        } else if (map && routingControlRef.current.remove) {
          routingControlRef.current.remove();
        }
      } catch (error) {
        console.log('Error removing routing control:', error);
      }
      routingControlRef.current = null;
      setRouteInfo(null);
    }

    if (coordinates.length < 2) {
      setRouteInfo(null);
      return;
    }

    // Add a small delay to ensure map is fully initialized
    initTimeoutRef.current = setTimeout(() => {
      try {
        const waypoints = coordinates.map(coord => 
          L.latLng(parseFloat(coord.latitude), parseFloat(coord.longitude))
        );

        const routingControl = L.Routing.control({
          waypoints: waypoints,
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          showAlternatives: false,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving',
          }),
          lineOptions: {
            styles: [
              { color: '#4285f4', opacity: 0.8, weight: 6 },
              { color: '#ffffff', opacity: 0.9, weight: 4 }
            ],
            extendToWaypoints: true,
            missingRouteTolerance: 0
          },
          createMarker: function() { return null; },
          show: false,
          collapsible: false
        });

        // Wrap addTo in try-catch to prevent initialization errors
        try {
          routingControl.addTo(map);
        } catch (error) {
          console.warn('Error adding routing control to map:', error);
          return;
        }

        routingControl.on('routesfound', function(e) {
          try {
            const routes = e.routes;
            const route = routes[0];
            const summary = route.summary;
            
            const distance = (summary.totalDistance / 1000).toFixed(1);
            const duration = Math.round(summary.totalTime / 60);
            
            const instructions = route.instructions.map((instruction, index) => {
              let distText = '';
              if (instruction.distance >= 1000) {
                distText = (instruction.distance / 1000).toFixed(1) + ' km';
              } else {
                distText = Math.round(instruction.distance) + ' m';
              }
              
              const coord = route.coordinates[instruction.index];
              
              return {
                text: instruction.text,
                distance: distText,
                type: instruction.type,
                lat: coord ? coord.lat : null,
                lng: coord ? coord.lng : null,
                index: index
              };
            });
            
            setRouteInfo({
              distance: distance,
              duration: duration,
              instructions: instructions
            });
          } catch (error) {
            console.warn('Error processing route:', error);
          }
        });

        routingControl.on('routingerror', function(e) {
          console.warn('Routing error:', e);
        });

        routingControlRef.current = routingControl;

        const container = routingControl.getContainer();
        if (container) {
          container.style.display = 'none';
        }
      } catch (error) {
        console.error('Error creating routing control:', error);
      }
    }, 100); // Small delay to ensure map is ready

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      if (routingControlRef.current && map) {
        try {
          if (map.hasControl && map.hasControl(routingControlRef.current)) {
            map.removeControl(routingControlRef.current);
          } else if (routingControlRef.current.remove) {
            routingControlRef.current.remove();
          }
        } catch (error) {
          console.log('Error removing routing control on cleanup:', error);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, coordinates]);

  useEffect(() => {
    if (!map || !hoveredStep || !hoveredStep.lat || !hoveredStep.lng) {
      if (isMountedRef.current && highlightMarkerRef.current && map && map.hasLayer(highlightMarkerRef.current)) {
        try {
          map.removeLayer(highlightMarkerRef.current);
        } catch (error) {
          console.log('Error removing highlight marker:', error);
        }
        highlightMarkerRef.current = null;
      }
      return;
    }

    const highlightIcon = L.divIcon({
      className: 'highlight-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #4285f4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(66, 133, 244, 0.8), 0 0 20px rgba(66, 133, 244, 0.5);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    if (isMountedRef.current && highlightMarkerRef.current && map.hasLayer(highlightMarkerRef.current)) {
      try {
        map.removeLayer(highlightMarkerRef.current);
      } catch (error) {
        console.log('Error removing existing highlight marker:', error);
      }
    }

    highlightMarkerRef.current = L.marker([hoveredStep.lat, hoveredStep.lng], {
      icon: highlightIcon,
      zIndexOffset: 1000
    }).addTo(map);

    if (hoveredStep.shouldPan) {
      map.panTo([hoveredStep.lat, hoveredStep.lng], {
        animate: true,
        duration: 0.5
      });
    }

    return () => {
      if (highlightMarkerRef.current && map && map.hasLayer(highlightMarkerRef.current)) {
        try {
          map.removeLayer(highlightMarkerRef.current);
        } catch (error) {
          console.log('Error removing highlight marker on cleanup:', error);
        }
        highlightMarkerRef.current = null;
      }
    };
  }, [map, hoveredStep]);

  useEffect(() => {
    if (routeInfo) {
      const infoControl = L.control({ position: 'topright' });
      
      infoControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'route-info');
        
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        
        let instructionsHtml = '';
        if (routeInfo.instructions && routeInfo.instructions.length > 0) {
          instructionsHtml = routeInfo.instructions.map((instruction, index) => {
            let icon = '➡️';
            const text = instruction.text.toLowerCase();
            
            if (text.includes('left')) icon = '↰';
            else if (text.includes('right')) icon = '↱';
            else if (text.includes('straight') || text.includes('continue')) icon = '⬆️';
            else if (text.includes('slight left')) icon = '↖️';
            else if (text.includes('slight right')) icon = '↗️';
            else if (text.includes('sharp left')) icon = '⬅️';
            else if (text.includes('sharp right')) icon = '➡️';
            else if (text.includes('arrive') || text.includes('destination')) icon = '🏁';
            else if (text.includes('head')) icon = '🧭';
            
            return `
              <div 
                class="direction-step" 
                data-step-index="${index}"
                data-lat="${instruction.lat || ''}"
                data-lng="${instruction.lng || ''}"
                style="
                  padding: 10px 12px;
                  border-bottom: 1px solid #eee;
                  font-size: 14px;
                  display: flex;
                  gap: 10px;
                  align-items: start;
                  cursor: pointer;
                  transition: all 0.2s ease;
                "
              >
                <span style="font-size: 18px; flex-shrink: 0;">${icon}</span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 500; color: #202124;">${instruction.text}</div>
                  <div style="font-size: 12px; color: #5f6368; margin-top: 2px;">${instruction.distance}</div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        div.innerHTML = `
          <div style="
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            overflow: hidden;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="
              padding: 12px 16px;
              background: #4285f4;
              color: white;
              font-weight: 600;
              font-size: 15px;
            ">
              Route Summary
            </div>
            <div style="
              padding: 12px 16px;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              gap: 16px;
            ">
              <div>
                <div style="font-size: 12px; color: #5f6368;">Distance</div>
                <div style="font-size: 18px; font-weight: 600; color: #202124;">${routeInfo.distance} km</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #5f6368;">Duration</div>
                <div style="font-size: 18px; font-weight: 600; color: #202124;">${routeInfo.duration} min</div>
              </div>
            </div>
            <div id="directions-list" style="
              max-height: 400px;
              overflow-y: auto;
            ">
              <div style="
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                color: #202124;
                border-bottom: 2px solid #e0e0e0;
                background: #f9f9f9;
                position: sticky;
                top: 0;
                z-index: 1;
              ">
                Turn-by-Turn Directions
              </div>
              ${instructionsHtml}
            </div>
          </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
          #directions-list::-webkit-scrollbar {
            width: 6px;
          }
          #directions-list::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 3px;
          }
          #directions-list::-webkit-scrollbar-thumb {
            background: #4285f4;
            border-radius: 3px;
          }
          #directions-list::-webkit-scrollbar-thumb:hover {
            background: #3367d6;
          }
          
          .direction-step:hover {
            background: #f8f9fa;
            border-left: 3px solid #4285f4;
            padding-left: 9px;
          }
          
          .direction-step:active {
            transform: scale(0.98);
            background: #e8f0fe !important;
          }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
          const steps = div.querySelectorAll('.direction-step');
          steps.forEach((step) => {
            step.addEventListener('mouseenter', function() {
              const lat = parseFloat(this.getAttribute('data-lat'));
              const lng = parseFloat(this.getAttribute('data-lng'));
              const index = parseInt(this.getAttribute('data-step-index'));
              
              if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                const instruction = routeInfo.instructions[index];
                setHoveredStep({ 
                  lat, 
                  lng, 
                  text: instruction.text,
                  shouldPan: false
                });
              }
            });
            
            step.addEventListener('mouseleave', function() {
              setHoveredStep(null);
            });
            
            step.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              const lat = parseFloat(this.getAttribute('data-lat'));
              const lng = parseFloat(this.getAttribute('data-lng'));
              const index = parseInt(this.getAttribute('data-step-index'));
              
              if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                const instruction = routeInfo.instructions[index];
                setHoveredStep({ 
                  lat, 
                  lng, 
                  text: instruction.text,
                  shouldPan: true
                });
              }
            });
          });
        }, 100);
        
        return div;
      };
      
      infoControl.addTo(map);
      
      return () => {
        map.removeControl(infoControl);
        setHoveredStep(null);
      };
    }
  }, [map, routeInfo]);

  return null;
}

function MapView({ coordinates, selectedPoint, tempMarker, onSelectPoint, onRightClick, onMarkerDragEnd }) {
  const defaultCenter = [47.4979, 19.0402];
  const [searchedLocation, setSearchedLocation] = useState(null);

  const handleAddSearchedLocation = useCallback((location) => {
    setSearchedLocation(location);
    // Trigger add with the name pre-filled
    onRightClick({ 
      lat: parseFloat(location.lat.toFixed(4)), // Round to 4 decimals
      lng: parseFloat(location.lng.toFixed(4)), // Round to 4 decimals
      name: location.name, // Pass the name along
      fullAddress: location.fullAddress // Pass full address too
    });
  }, [onRightClick]);
  
  // Clear searched location when tempMarker is null (form cancelled/saved)
  useEffect(() => {
    if (!tempMarker) {
      setSearchedLocation(null);
    }
  }, [tempMarker]);

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SearchControl onSelectLocation={handleAddSearchedLocation} />
        <MapRightClickHandler onRightClick={onRightClick} />
        <RoutingMachine coordinates={coordinates} />
        <ZoomToLocation location={searchedLocation} />
        
        {searchedLocation && (
          <Marker
            position={[searchedLocation.lat, searchedLocation.lng]}
            icon={tempIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#202124', fontSize: '14px' }}>
                  {searchedLocation.name}
                </h4>
                <p style={{ margin: '0 0 8px 0', color: '#5f6368', fontSize: '12px', lineHeight: '1.4' }}>
                  {searchedLocation.fullAddress}
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#34a853', fontWeight: 'bold', fontSize: '13px' }}>
                  📍 Searched location
                </p>
                <small style={{ color: '#5f6368', fontSize: '11px', fontFamily: 'monospace' }}>
                  {searchedLocation.lat.toFixed(4)}, {searchedLocation.lng.toFixed(4)}
                </small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {tempMarker && !searchedLocation && (
          <Marker
            position={[tempMarker.lat, tempMarker.lng]}
            icon={tempIcon}
          >
            <Popup>
              <div>
                <h4>New Point</h4>
                <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                  📍 Right-click location
                </p>
                <small>
                  {tempMarker.lat.toFixed(4)}, {tempMarker.lng.toFixed(4)}
                </small>
                <br />
                <small style={{ color: '#666', fontStyle: 'italic' }}>
                  Enter the name in the sidebar panel
                </small>
              </div>
            </Popup>
          </Marker>
        )}
        
        {coordinates.map((coord) => {
          const position = [parseFloat(coord.latitude), parseFloat(coord.longitude)];
          const isSelected = selectedPoint && selectedPoint.id === coord.id;
          
          return (
            <Marker
              key={coord.id}
              position={position}
              icon={isSelected ? selectedIcon : new L.Icon.Default()}
              draggable={true}
              eventHandlers={{
                click: () => onSelectPoint(coord),
                dragend: (e) => {
                  const newPos = e.target.getLatLng();
                  onMarkerDragEnd(coord.id, newPos.lat, newPos.lng);
                }
              }}
            >
              <Popup>
                <div>
                  <h4>{coord.name}</h4>
                  {coord.description && <p>{coord.description}</p>}
                  <small>
                    {parseFloat(coord.latitude).toFixed(4)}, {parseFloat(coord.longitude).toFixed(4)}
                  </small>
                  <br />
                  <small style={{ color: '#666', fontStyle: 'italic' }}>
                    Drag marker to change position
                  </small>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapBounds coordinates={coordinates} />
      </MapContainer>
    </div>
  );
}

export default MapView;
