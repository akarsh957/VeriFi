import React, { useState, useEffect } from 'react';
import { X, MapPin, Compass, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AddVenueModal = ({ 
  isOpen, 
  onClose, 
  onVenueCreated, 
  pickedLatitude, 
  pickedLongitude, 
  onEnterMapPickMode 
}) => {
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [placeType, setPlaceType] = useState('Cafe');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Sync coords from map picker if the user picked them on the map
  useEffect(() => {
    if (pickedLatitude) setLatitude(pickedLatitude.toFixed(6));
    if (pickedLongitude) setLongitude(pickedLongitude.toFixed(6));
  }, [pickedLatitude, pickedLongitude]);

  if (!isOpen) return null;

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to retrieve GPS location. Please check your browser permissions.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !address.trim() || !latitude || !longitude || !placeType) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          placeType
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create venue.');
      }

      // Reset form
      setName('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setPlaceType('Cafe');

      onVenueCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-glass glass" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
          <X size={20} />
        </button>

        <h2 className="modal-title">Register New Venue</h2>

        {error && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#fca5a5', 
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="venue-name">Venue Name</label>
            <input
              id="venue-name"
              type="text"
              className="form-input"
              placeholder="e.g. Blue Bottle Coffee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="venue-address">Street Address</label>
            <input
              id="venue-address"
              type="text"
              className="form-input"
              placeholder="e.g. 54 2nd St, San Francisco, CA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="venue-type">Place Type</label>
            <select
              id="venue-type"
              className="form-input"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              disabled={isSubmitting}
              style={{ background: 'var(--bg-input)' }}
            >
              <option value="Cafe">Cafe</option>
              <option value="Hotel">Hotel</option>
              <option value="Coworking">Coworking Space</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Geographic Location</label>
            <div className="form-row">
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                disabled={isSubmitting}
              />
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                onClick={handleUseGPS}
                disabled={isSubmitting || gpsLoading}
              >
                <Compass size={14} className={gpsLoading ? 'logo-icon' : ''} style={{ animation: gpsLoading ? 'rotate-slow 2s linear infinite' : 'none' }} />
                {gpsLoading ? 'Locating...' : 'Use Current GPS'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                onClick={onEnterMapPickMode}
                disabled={isSubmitting}
              >
                <MapPin size={14} />
                Pick On Map
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '16px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering Venue...' : 'Register Venue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVenueModal;
