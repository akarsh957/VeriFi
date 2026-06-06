import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, Zap, Clock, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VenueDetails = ({ venue, onBack, onOpenSpeedTest, onOpenLogin, lastLogUpdated }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgPing, setAvgPing] = useState(0);

  // Fetch speed logs for this venue
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/speedtests/venue/${venue._id}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
          
          // Calculate average ping
          if (data.length > 0) {
            const totalPing = data.reduce((sum, log) => sum + log.ping, 0);
            setAvgPing(Math.round(totalPing / data.length));
          } else {
            setAvgPing(0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch speed test logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [venue._id, lastLogUpdated]);

  const handleRunSpeedTest = () => {
    if (!user) {
      // Prompt sign in
      onOpenLogin();
    } else {
      onOpenSpeedTest();
    }
  };

  return (
    <div className="venue-details">
      <div className="details-header">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to list</span>
        </button>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px' }}>{venue.name}</h2>
          <span className={`venue-type-badge ${
            venue.placeType === 'Cafe' ? 'type-cafe' : 
            venue.placeType === 'Hotel' ? 'type-hotel' : 'type-coworking'
          }`}>
            {venue.placeType}
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{venue.address}</span>
            {venue.distance !== undefined && venue.distance !== null && (
              <span style={{ 
                color: 'var(--secondary)', 
                fontWeight: 600,
                fontSize: '0.75rem',
                background: 'rgba(6, 182, 212, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                whiteSpace: 'nowrap'
              }}>
                {venue.distance < 1 
                  ? `${Math.round(venue.distance * 1000)} m away` 
                  : `${venue.distance.toFixed(1)} km away`}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="details-body">
        {/* Aggregated Stats Overview */}
        <div>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Performance Dashboard
          </h3>
          <div className="stats-grid">
            <div className="stat-item-box">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>
                <ArrowDown size={18} />
              </div>
              <span className="stat-num">{venue.averageDownloadSpeed || '-'}</span>
              <span className="stat-desc">DL Mbps</span>
            </div>

            <div className="stat-item-box">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)' }}>
                <ArrowUp size={18} />
              </div>
              <span className="stat-num">{venue.averageUploadSpeed || '-'}</span>
              <span className="stat-desc">UL Mbps</span>
            </div>

            <div className="stat-item-box">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent)' }}>
                <Zap size={18} />
              </div>
              <span className="stat-num">{avgPing || '-'}</span>
              <span className="stat-desc">Ping Ms</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="btn btn-primary" onClick={handleRunSpeedTest} style={{ width: '100%', padding: '12px' }}>
          <Plus size={16} />
          Verify WiFi Speed
        </button>

        {/* Logs Timeline */}
        <div>
          <div className="log-section-title">
            <span>Speed Verification History</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {logs.length} tests logged
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px 20px', 
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: '8px'
            }}>
              No speed verifications yet. Be the first to verify!
            </div>
          ) : (
            <div className="logs-timeline">
              {logs.map((log) => (
                <div key={log._id} className="log-timeline-card">
                  <div className="log-card-meta">
                    <div className="log-user-info">
                      <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '0.65rem' }}>
                        {log.userId?.name ? log.userId.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{log.userId?.name || 'Anonymous'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="log-card-speeds">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="speed-label" style={{ fontSize: '0.6rem' }}>Download</span>
                      <span className="log-speed-val" style={{ color: 'var(--secondary)' }}>
                        {log.downloadSpeed} Mbps
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="speed-label" style={{ fontSize: '0.6rem' }}>Upload</span>
                      <span className="log-speed-val" style={{ color: 'var(--primary)' }}>
                        {log.uploadSpeed} Mbps
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="speed-label" style={{ fontSize: '0.6rem' }}>Latency</span>
                      <span className="log-speed-val" style={{ color: 'var(--accent)' }}>
                        {log.ping} ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
