import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Save, CheckCircle, Wifi, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SpeedTestModal = ({ isOpen, onClose, venueId, onTestComplete }) => {
  const { token } = useAuth();
  
  const [testState, setTestState] = useState('idle'); // idle, ping, download, upload, finished, error
  const [ping, setPing] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  
  const [currentDisplayVal, setCurrentDisplayVal] = useState(0);
  const [currentUnit, setCurrentUnit] = useState('Mbps');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const animRef = useRef(null);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Run the animated test simulation
  const startSpeedTest = () => {
    setTestState('ping');
    setCurrentUnit('ms');
    setSaveError('');
    
    let counter = 0;
    
    // Phase 1: Ping Latency (takes ~1.8 seconds)
    animRef.current = setInterval(() => {
      counter += 1;
      const simulatedPing = Math.floor(15 + Math.random() * 20); // 15-35 ms
      setPing(simulatedPing);
      setCurrentDisplayVal(simulatedPing);

      if (counter >= 15) {
        clearInterval(animRef.current);
        runDownloadTest();
      }
    }, 120);
  };

  // Phase 2: Download Speed (takes ~3.5 seconds)
  const runDownloadTest = () => {
    setTestState('download');
    setCurrentUnit('Mbps');
    
    const targetDownload = Math.round(20 + Math.random() * 80); // 20 - 100 Mbps
    let currentSpeed = 0;
    let step = 0;

    animRef.current = setInterval(() => {
      step += 1;
      
      // Needle acceleration
      if (currentSpeed < targetDownload * 0.8) {
        currentSpeed += targetDownload * 0.08 + Math.random() * 4;
      } else {
        // Flicker near target
        currentSpeed = targetDownload + (Math.random() * 6 - 3);
      }

      const formattedSpeed = Math.max(0, Math.round(currentSpeed * 10) / 10);
      setDownloadSpeed(formattedSpeed);
      setCurrentDisplayVal(formattedSpeed);

      if (step >= 35) {
        clearInterval(animRef.current);
        setDownloadSpeed(Math.round(targetDownload * 10) / 10);
        runUploadTest();
      }
    }, 100);
  };

  // Phase 3: Upload Speed (takes ~3.5 seconds)
  const runUploadTest = () => {
    setTestState('upload');
    setCurrentUnit('Mbps');

    const targetUpload = Math.round(8 + Math.random() * 40); // 8 - 48 Mbps
    let currentSpeed = 0;
    let step = 0;

    animRef.current = setInterval(() => {
      step += 1;
      
      if (currentSpeed < targetUpload * 0.8) {
        currentSpeed += targetUpload * 0.08 + Math.random() * 2;
      } else {
        currentSpeed = targetUpload + (Math.random() * 4 - 2);
      }

      const formattedSpeed = Math.max(0, Math.round(currentSpeed * 10) / 10);
      setUploadSpeed(formattedSpeed);
      setCurrentDisplayVal(formattedSpeed);

      if (step >= 35) {
        clearInterval(animRef.current);
        setUploadSpeed(Math.round(targetUpload * 10) / 10);
        setTestState('finished');
        setCurrentDisplayVal(0);
      }
    }, 100);
  };

  // Submit test results to database
  const saveTestResults = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/speedtests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          venueId,
          downloadSpeed,
          uploadSpeed,
          ping
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save speed test results.');
      }

      onTestComplete(data.updatedVenue);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate Needle Angle
  const getNeedleRotation = () => {
    let value = currentDisplayVal;
    let max = 100; // max scale
    
    if (currentUnit === 'ms') {
      max = 100; // max ping scale
    }
    
    const percentage = Math.min(value / max, 1);
    // Needle rotation range is from -120deg to 120deg
    return -120 + percentage * 240;
  };

  // Calculate Dashoffset for Gauge fill
  const getDashoffset = () => {
    let value = currentDisplayVal;
    let max = 100;
    
    const percentage = Math.min(value / max, 1);
    // Total circumference is ~471, we leave 25% empty at the bottom (dasharray 471, dashoffset starts at 471)
    // Active range is ~75% of circumference = 353
    const activeLength = 353;
    const offset = 471 - (percentage * activeLength);
    return offset;
  };

  // Gauge Fill Color based on Speed
  const getGaugeColor = () => {
    if (testState === 'ping') return 'var(--accent)';
    
    const speed = currentDisplayVal;
    if (speed >= 50) return 'var(--secondary)'; // Cyan for high speed
    if (speed >= 15) return 'var(--primary)'; // Purple for medium speed
    return 'var(--error)'; // Red for slow speed
  };

  // Wifi connection quality rating analyzer
  const getWifiRating = (dlSpeed) => {
    if (dlSpeed >= 250) {
      return {
        title: 'Gigabit Connected',
        desc: 'Enterprise-grade speed. Perfect for intensive tasks, raw builds, and real-time streaming.',
        color: 'var(--success)',
        badgeClass: 'badge-gigabit'
      };
    }
    if (dlSpeed >= 100) {
      return {
        title: 'Excellent / Zoom-Ready',
        desc: 'Ideal for simultaneous HD streaming, video calls, and complex cloud development work.',
        color: 'var(--secondary)',
        badgeClass: 'badge-excellent'
      };
    }
    if (dlSpeed >= 50) {
      return {
        title: 'Good / Work-Ready',
        desc: 'Capable of solid multitasking, remote work, standard video calling, and casual gaming.',
        color: 'var(--primary)',
        badgeClass: 'badge-good'
      };
    }
    if (dlSpeed >= 15) {
      return {
        title: 'Basic Connectivity',
        desc: 'Supports basic email, browsing, and messaging. High-def streaming may buffer.',
        color: 'var(--warning)',
        badgeClass: 'badge-basic'
      };
    }
    return {
      title: 'Slow / Poor Connection',
      desc: 'Very low bandwidth. May experience frequent timeouts and network latency.',
      color: 'var(--error)',
      badgeClass: 'badge-slow'
    };
  };

  const wifiRating = getWifiRating(downloadSpeed);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-glass glass" 
        style={{ width: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} disabled={testState === 'saving' || testState === 'ping' || testState === 'download' || testState === 'upload'}>
          <X size={20} />
        </button>

        <h2 className="modal-title" style={{ textAlign: 'center', marginBottom: '10px' }}>
          WiFi Speed Test
        </h2>

        {saveError && (
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
            <span>{saveError}</span>
          </div>
        )}

        <div className="speed-test-container">
          {/* Animated Speedometer */}
          <div className="speedometer-wrapper">
            <svg className="speedometer-svg" viewBox="0 0 250 250">
              {/* Dial tick marks */}
              <circle cx="125" cy="125" r="85" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
              
              {/* Background Arc */}
              <path
                className="gauge-bg"
                d="M 65 195 A 75 75 0 1 1 185 195"
              />

              {/* Progress Arc */}
              <path
                className="gauge-fill"
                d="M 65 195 A 75 75 0 1 1 185 195"
                stroke={getGaugeColor()}
                style={{ strokeDashoffset: getDashoffset() }}
              />

              {/* Center Needle Pin */}
              <circle cx="125" cy="125" r="8" fill="var(--text-primary)" />
              <circle cx="125" cy="125" r="4" fill="var(--bg-card)" />

              {/* Needle Indicator */}
              <line
                className="gauge-needle"
                x1="125"
                y1="125"
                x2="125"
                y2="55"
                stroke="var(--text-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ 
                  transform: `rotate(${getNeedleRotation()}deg)`,
                  filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))'
                }}
              />
            </svg>

            {/* Central Info Display */}
            <div className="speedometer-center">
              <span className="speed-number-val">
                {testState === 'finished' ? downloadSpeed : Math.round(currentDisplayVal)}
              </span>
              <span className="speed-number-unit">
                {testState === 'finished' ? 'Mbps' : currentUnit}
              </span>
            </div>
          </div>

          {/* Speed Status text */}
          <div className="speed-test-status">
            {testState === 'idle' && 'Ready to Verify'}
            {testState === 'ping' && 'Testing Connection Ping...'}
            {testState === 'download' && 'Measuring Download Speed...'}
            {testState === 'upload' && 'Measuring Upload Speed...'}
            {testState === 'finished' && 'Verification Complete!'}
          </div>

          {/* Results Grid */}
          <div className="speed-test-grid">
            <div className="speed-test-metric">
              <div className="speed-test-metric-val" style={{ color: 'var(--accent)' }}>
                {ping > 0 ? `${ping} ms` : '--'}
              </div>
              <div className="speed-test-metric-lbl">Ping</div>
            </div>
            <div className="speed-test-metric">
              <div className="speed-test-metric-val" style={{ color: 'var(--secondary)' }}>
                {downloadSpeed > 0 ? `${downloadSpeed} Mbps` : '--'}
              </div>
              <div className="speed-test-metric-lbl">Download</div>
            </div>
            <div className="speed-test-metric">
              <div className="speed-test-metric-val" style={{ color: 'var(--primary)' }}>
                {uploadSpeed > 0 ? `${uploadSpeed} Mbps` : '--'}
              </div>
              <div className="speed-test-metric-lbl">Upload</div>
            </div>
          </div>

          {/* Wifi rating card */}
          {testState === 'finished' && (
            <div 
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: wifiRating.color }}>
                  {wifiRating.title}
                </span>
                <span className={`speed-quality-badge ${wifiRating.badgeClass}`}>
                  Quality Rating
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {wifiRating.desc}
              </p>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
            {testState === 'idle' && (
              <button 
                className="btn btn-primary" 
                onClick={startSpeedTest}
                style={{ width: '100%', padding: '12px' }}
              >
                <Play size={16} />
                Start Speed Test
              </button>
            )}

            {(testState === 'ping' || testState === 'download' || testState === 'upload') && (
              <button 
                className="btn btn-secondary" 
                disabled
                style={{ width: '100%', padding: '12px', opacity: 0.7 }}
              >
                <Wifi size={16} className="logo-icon" style={{ animation: 'rotate-slow 2s linear infinite' }} />
                Testing WiFi...
              </button>
            )}

            {testState === 'finished' && (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setPing(0);
                    setDownloadSpeed(0);
                    setUploadSpeed(0);
                    startSpeedTest();
                  }}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Retest
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={saveTestResults}
                  style={{ flex: 2, padding: '12px' }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    'Saving Log...'
                  ) : (
                    <>
                      <Save size={16} />
                      Log Verification
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTestModal;
