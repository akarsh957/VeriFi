import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import VenueCard from './components/VenueCard';
import VenueDetails from './components/VenueDetails';
import SpeedTestModal from './components/SpeedTestModal';
import AddVenueModal from './components/AddVenueModal';
import AuthModals from './components/AuthModals';
import { Search, MapPin, Compass } from 'lucide-react';
import './App.css';

function App() {
  // Data States
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [lastLogUpdated, setLastLogUpdated] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, speed, reliability
  
  // Coordinates State
  const [centerCoords, setCenterCoords] = useState(null); // [lat, lng]

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState('login'); // login | register
  const [speedTestOpen, setSpeedTestOpen] = useState(false);
  const [addVenueOpen, setAddVenueOpen] = useState(false);

  // Map Pick States
  const [pickLocationMode, setPickLocationMode] = useState(false);
  const [pickedLatitude, setPickedLatitude] = useState(null);
  const [pickedLongitude, setPickedLongitude] = useState(null);

  // Toast System
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Get User Current Location on Startup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterCoords([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Default to London if permission denied
          setCenterCoords([51.505, -0.09]);
        }
      );
    } else {
      // Default to London if not supported
      setCenterCoords([51.505, -0.09]);
    }
  }, []);

  // Fetch Venues
  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/venues');
      if (res.ok) {
        const data = await res.json();
        setVenues(data);
      } else {
        showToast('Failed to load venues.', 'error');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Network error loading venues.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [lastLogUpdated]);

  // Handle Venue Creation Success
  const handleVenueCreated = (newVenue) => {
    setVenues((prev) => [...prev, newVenue]);
    setSelectedVenue(newVenue);
    showToast(`Successfully registered ${newVenue.name}!`, 'success');
  };

  // Handle Speed Test Complete Success
  const handleTestComplete = (updatedVenue) => {
    setLastLogUpdated(Date.now());
    // Update selected venue to show new averages
    setSelectedVenue(updatedVenue);
    // Refresh venues in list
    setVenues((prev) => 
      prev.map((v) => v._id === updatedVenue._id ? updatedVenue : v)
    );
    showToast('Speed log saved successfully! Venue rating updated.', 'success');
  };

  // Map coordinate picking flow
  const handleConfirmLocation = () => {
    setPickLocationMode(false);
    setAddVenueOpen(true);
    showToast('Coordinates locked in!', 'success');
  };

  const handleCancelLocation = () => {
    setPickLocationMode(false);
    setAddVenueOpen(true);
  };

  // Local filtering & sorting logic
  const filteredVenues = venues
    .filter((venue) => {
      const matchesSearch = 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = 
        selectedType === 'All' || 
        venue.placeType === selectedType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'speed') {
        return b.averageDownloadSpeed - a.averageDownloadSpeed;
      }
      if (sortBy === 'reliability') {
        return b.reliabilityScore - a.reliabilityScore;
      }
      return 0;
    });

  // Open modals handlers
  const openLogin = () => {
    setAuthModalType('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalType('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header bar */}
      {!pickLocationMode && (
        <Header 
          onOpenLogin={openLogin}
          onOpenRegister={openRegister}
          onAddVenueClick={() => setAddVenueOpen(true)}
        />
      )}

      {/* Pick Location Mode Floating Controls */}
      {pickLocationMode && (
        <div 
          className="glass"
          style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '16px 24px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-glow-purple)'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>
            Drag the map to center the crosshair on your venue
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleCancelLocation}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmLocation}>
              Confirm Location
            </button>
          </div>
        </div>
      )}

      {/* Main dashboard space */}
      <main className="main-content" style={{ height: pickLocationMode ? '100vh' : 'calc(100vh - 76px)' }}>
        
        {/* Sidebar */}
        {!pickLocationMode && (
          <aside className="sidebar">
            {selectedVenue ? (
              <VenueDetails 
                venue={selectedVenue} 
                onBack={() => setSelectedVenue(null)}
                onOpenSpeedTest={() => setSpeedTestOpen(true)}
                onOpenLogin={openLogin}
                lastLogUpdated={lastLogUpdated}
              />
            ) : (
              <>
                {/* Search & Filter widgets */}
                <div className="search-filter-container">
                  <div className="search-box">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search cafes, hotels, coworking..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-row">
                    {['All', 'Cafe', 'Hotel', 'Coworking'].map((type) => (
                      <button
                        key={type}
                        className={`filter-badge ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type)}
                      >
                        {type === 'All' ? 'All Places' : type}
                      </button>
                    ))}
                  </div>

                  <div className="sort-container">
                    <span>Showing {filteredVenues.length} results</span>
                    <div>
                      <span>Sort by: </span>
                      <select 
                        className="sort-select" 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="name">Name</option>
                        <option value="speed">Speed (DL)</option>
                        <option value="reliability">Reliability</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Venue List */}
                <div className="venue-list">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      Loading venues...
                    </div>
                  ) : filteredVenues.length === 0 ? (
                    <div className="no-venues">
                      <h3>No venues found</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                        Try search query or click "Add Venue" above to create one.
                      </p>
                    </div>
                  ) : (
                    filteredVenues.map((venue) => (
                      <VenueCard
                        key={venue._id}
                        venue={venue}
                        onClick={() => setSelectedVenue(venue)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </aside>
        )}

        {/* Map Panel */}
        <MapContainer
          venues={filteredVenues}
          selectedVenue={selectedVenue}
          onSelectVenue={(venue) => setSelectedVenue(venue)}
          pickLocationMode={pickLocationMode}
          centerCoords={centerCoords}
          onLocationPicked={(lat, lng) => {
            setPickedLatitude(lat);
            setPickedLongitude(lng);
          }}
        />
      </main>

      {/* Auth Modals (Login/Register) */}
      <AuthModals
        isOpen={authModalOpen}
        type={authModalType}
        onClose={() => setAuthModalOpen(false)}
        setModalType={setAuthModalType}
      />

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={addVenueOpen}
        onClose={() => setAddVenueOpen(false)}
        onVenueCreated={handleVenueCreated}
        pickedLatitude={pickedLatitude}
        pickedLongitude={pickedLongitude}
        onEnterMapPickMode={() => {
          setAddVenueOpen(false);
          setPickLocationMode(true);
        }}
      />

      {/* Speed Test Simulation Modal */}
      {selectedVenue && (
        <SpeedTestModal
          isOpen={speedTestOpen}
          onClose={() => setSpeedTestOpen(false)}
          venueId={selectedVenue._id}
          onTestComplete={handleTestComplete}
        />
      )}
    </div>
  );
}

export default App;
