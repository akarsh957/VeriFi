import React from 'react';
import { ArrowDown, ArrowUp, MapPin } from 'lucide-react';

const VenueCard = ({ venue, onClick }) => {
  const { name, address, placeType, averageDownloadSpeed, averageUploadSpeed, reliabilityScore } = venue;

  // Type badge styling helper
  const getBadgeClass = (type) => {
    switch (type) {
      case 'Cafe': return 'type-cafe';
      case 'Hotel': return 'type-hotel';
      case 'Coworking': return 'type-coworking';
      default: return '';
    }
  };

  // Reliability Gauge Calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (reliabilityScore / 100) * circumference;

  // Reliability Color Helper
  const getReliabilityColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="venue-card glass-interactive" onClick={onClick}>
      <div className="venue-card-header">
        <div>
          <h3 className="venue-title">{name}</h3>
          <span className={`venue-type-badge ${getBadgeClass(placeType)}`}>
            {placeType}
          </span>
        </div>
      </div>

      <div className="venue-address">
        <MapPin size={14} style={{ flexShrink: 0 }} />
        <span style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          maxWidth: '300px'
        }}>{address}</span>
      </div>

      <div className="venue-card-stats">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="speed-metric-compact">
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.1)', 
              borderRadius: '50%', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary)'
            }}>
              <ArrowDown size={14} />
            </div>
            <div className="speed-value-wrapper">
              <span className="speed-value">{averageDownloadSpeed || '-'}</span>
              <span className="speed-label">DL Mbps</span>
            </div>
          </div>

          <div className="speed-metric-compact">
            <div style={{ 
              background: 'rgba(124, 58, 237, 0.1)', 
              borderRadius: '50%', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <ArrowUp size={14} />
            </div>
            <div className="speed-value-wrapper">
              <span className="speed-value">{averageUploadSpeed || '-'}</span>
              <span className="speed-label">UL Mbps</span>
            </div>
          </div>
        </div>

        <div className="reliability-gauge-container" title={`Reliability: ${reliabilityScore}%`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="reliability-percentage" style={{ color: getReliabilityColor(reliabilityScore) }}>
              {reliabilityScore}%
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Reliable
            </span>
          </div>
          <svg width="44" height="44" className="reliability-circle">
            {/* Background Circle */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="4"
            />
            {/* Progress Circle */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="transparent"
              stroke={getReliabilityColor(reliabilityScore)}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
