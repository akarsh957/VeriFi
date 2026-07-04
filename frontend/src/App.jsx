import React, { useState, useEffect } from 'react';
import { API_BASE } from './config';
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
  const [activeTab, setActiveTab] = useState('all'); // all | nearby
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
  const [loadingVenues, setLoadingVenues] = useState(false); // rename inner variable to avoid name clash if any
  const fetchVenues = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/venues`;
      if (activeTab === 'nearby' && centerCoords) {
        url = `${API_BASE}/api/venues/search?lat=${centerCoords[0]}&lng=${centerCoords[1]}&radius=5000`;
      }
      const res = await fetch(url);
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
  }, [lastLogUpdated, activeTab, centerCoords]);

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

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  // Local filtering & sorting logic
  const filteredVenues = venues
    .map((venue) => {
      let distance = null;
      if (centerCoords) {
        const [lng, lat] = venue.location.coordinates;
        distance = calculateDistance(centerCoords[0], centerCoords[1], lat, lng);
      }
      return { ...venue, distance };
    })
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
      if (sortBy === 'proximity') {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      return 0;
    });

  // Calculate Global Analytics Metrics
  const totalVenuesCount = venues.length;
  const verifiedVenues = venues.filter(v => v.averageDownloadSpeed > 0);
  const averageDownloadSpeed = verifiedVenues.length 
    ? Math.round(verifiedVenues.reduce((acc, v) => acc + v.averageDownloadSpeed, 0) / verifiedVenues.length) 
    : 0;
  const fastestVenueSpeed = verifiedVenues.length 
    ? Math.round(Math.max(...verifiedVenues.map(v => v.averageDownloadSpeed))) 
    : 0;

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
                {/* Tabs for All Locations vs Nearby */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                  <button 
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'all' ? '2px solid var(--secondary)' : '2px solid transparent',
                      color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontFamily: 'inherit'
                    }}
                    onClick={() => setActiveTab('all')}
                  >
                    All Locations
                  </button>
                  <button 
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: activeTab === 'nearby' ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'nearby' ? '2px solid var(--secondary)' : '2px solid transparent',
                      color: activeTab === 'nearby' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontFamily: 'inherit'
                    }}
                    onClick={() => {
                      if (!centerCoords) {
                        showToast('Searching for your GPS location...', 'info');
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setCenterCoords([position.coords.latitude, position.coords.longitude]);
                              setActiveTab('nearby');
                              showToast('GPS location locked!', 'success');
                            },
                            (error) => {
                              showToast('GPS permission denied. Showing all places instead.', 'error');
                              setActiveTab('all');
                            }
                          );
                        }
                      } else {
                        setActiveTab('nearby');
                      }
                    }}
                  >
                    Nearby (5 km)
                  </button>
                </div>

                {/* Global Analytics Overview */}
                <div style={{ padding: '20px 20px 0 20px' }}>
                  <div className="dashboard-title-row">
                    <span className="dashboard-title">Global Overview</span>
                  </div>
                  <div className="dashboard-metrics-grid">
                    <div className="dashboard-metric-card">
                      <span className="dashboard-metric-val">{totalVenuesCount}</span>
                      <span className="dashboard-metric-lbl">Total Spots</span>
                    </div>
                    <div className="dashboard-metric-card">
                      <span className="dashboard-metric-val">{averageDownloadSpeed} <span style={{fontSize: '0.75rem', fontWeight: 500}}>Mb/s</span></span>
                      <span className="dashboard-metric-lbl">Avg Speed</span>
                    </div>
                    <div className="dashboard-metric-card">
                      <span className="dashboard-metric-val" style={{color: 'var(--secondary)'}}>{fastestVenueSpeed} <span style={{fontSize: '0.75rem', fontWeight: 500}}>Mb/s</span></span>
                      <span className="dashboard-metric-lbl">Fastest Local</span>
                    </div>
                  </div>
                </div>


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
                        {centerCoords && <option value="proximity">Proximity</option>}
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
