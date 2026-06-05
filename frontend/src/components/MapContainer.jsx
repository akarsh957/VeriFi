import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation } from 'lucide-react';

const MapContainer = ({ 
  venues, 
  selectedVenue, 
  onSelectVenue, 
  pickLocationMode, 
  onLocationPicked,
  centerCoords
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);
  const userMarker = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (mapInstance.current) return;

    // Use default coordinates if not provided (e.g., London or NY)
    const initialLat = centerCoords ? centerCoords[0] : 40.7128;
    const initialLng = centerCoords ? centerCoords[1] : -74.0060;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true
    }).setView([initialLat, initialLng], 13);

    // Dark styled tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    markersGroup.current = L.layerGroup().addTo(mapInstance.current);

    // Bind map click handler for picking location
    mapInstance.current.on('click', (e) => {
      // In pickLocationMode, we click to choose coords
      // But we can also check the center coords on map move, which is even cooler!
    });

    // Clean up on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update center when centerCoords changes
  useEffect(() => {
    if (!mapInstance.current || !centerCoords) return;
    mapInstance.current.setView([centerCoords[0], centerCoords[1]], 14);

    // Update user marker
    if (userMarker.current) {
      markersGroup.current.removeLayer(userMarker.current);
    }

    const userColor = '#06B6D4'; // secondary cyan
    const userIcon = L.divIcon({
      className: 'user-position-marker',
      html: `
        <div style="
          background-color: ${userColor};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid #FFF;
          box-shadow: 0 0 12px ${userColor};
          position: relative;
        ">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid ${userColor};
            animation: rotate-slow 3s linear infinite;
            opacity: 0.4;
            top: -9px;
            left: -9px;
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarker.current = L.marker([centerCoords[0], centerCoords[1]], { icon: userIcon })
      .addTo(markersGroup.current)
      .bindPopup('Your Location')
      .openPopup();

  }, [centerCoords]);

  // Update Selected Venue View
  useEffect(() => {
    if (!mapInstance.current || !selectedVenue) return;
    const [lng, lat] = selectedVenue.location.coordinates;
    mapInstance.current.setView([lat, lng], 15);
  }, [selectedVenue]);

  // Setup click & drag listeners for Location Pick Mode
  useEffect(() => {
    if (!mapInstance.current) return;

    const handleMapMove = () => {
      if (pickLocationMode) {
        const center = mapInstance.current.getCenter();
        onLocationPicked(center.lat, center.lng);
      }
    };

    if (pickLocationMode) {
      mapInstance.current.on('move', handleMapMove);
      // Pick initial center
      const center = mapInstance.current.getCenter();
      onLocationPicked(center.lat, center.lng);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('move', handleMapMove);
      }
    };
  }, [pickLocationMode, onLocationPicked]);

  // Update Markers when venues list changes
  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current || pickLocationMode) return;

    // Clear old markers (excluding user marker if it exists)
    markersGroup.current.clearLayers();

    // Re-add user marker if we have center coords
    if (centerCoords && userMarker.current) {
      userMarker.current.addTo(markersGroup.current);
    }

    venues.forEach((venue) => {
      const [longitude, latitude] = venue.location.coordinates;
      const speed = venue.averageDownloadSpeed;
      const type = venue.placeType;

      // Color coding based on type
      let markerColor = '#7C3AED';
      if (type === 'Cafe') markerColor = '#F59E0B';
      else if (type === 'Hotel') markerColor = '#3B82F6';
      else if (type === 'Coworking') markerColor = '#10B981';

      const customIcon = L.divIcon({
        className: 'custom-venue-pin',
        html: `
          <div style="
            background: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5), 0 0 8px ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 10px;
            position: relative;
            cursor: pointer;
            transition: transform 0.2s ease;
          " class="venue-pin-inner">
            <span>${speed > 0 ? Math.round(speed) : '-'}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon })
        .addTo(markersGroup.current)
        .on('click', () => {
          onSelectVenue(venue);
        });

      // Bind a simple custom popup
      const popupContent = `
        <div style="font-family: 'Outfit', sans-serif; min-width: 140px;">
          <h4 style="font-weight: 700; margin: 0 0 4px 0; color: #FFF;">${venue.name}</h4>
          <p style="font-size: 0.75rem; color: #9CA3AF; margin: 0 0 8px 0;">${venue.address}</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
            <span>DL: <strong>${speed} Mbps</strong></span>
            <span>Reliable: <strong>${venue.reliabilityScore}%</strong></span>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
    });

  }, [venues, centerCoords, pickLocationMode]);

  // Center around user GPS location
  const handleLocateUser = () => {
    if (navigator.geolocation && mapInstance.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current.setView([latitude, longitude], 14);
          if (onLocationPicked) {
            onLocationPicked(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not retrieve your current location. Please verify your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="map-pane">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
      
      {pickLocationMode && (
        <div className="map-crosshair">
          <div className="crosshair-line crosshair-h"></div>
          <div className="crosshair-line crosshair-v"></div>
          <div className="crosshair-dot"></div>
        </div>
      )}

      {!pickLocationMode && (
        <button 
          className="btn btn-icon-only map-action-btn"
          style={{ bottom: '24px', right: '24px' }}
          onClick={handleLocateUser}
          title="Center on my location"
        >
          <Navigation size={20} style={{ transform: 'rotate(45deg)' }} />
        </button>
      )}
    </div>
  );
};

export default MapContainer;
