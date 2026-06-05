import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';

const AuthModals = ({ isOpen, type, onClose, setModalType }) => {
  const { login, register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when modal opens/closes or changes type
  useEffect(() => {
    clearError();
    setValidationError('');
    setName('');
    setEmail('');
    setPassword('');
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsSubmitting(true);

    if (type === 'register' && !name.trim()) {
      setValidationError('Please enter your name');
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() || !password) {
      setValidationError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    let success = false;
    if (type === 'login') {
      success = await login(email, password);
    } else {
      success = await register(name, email, password);
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-glass glass" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="modal-title">
          {type === 'login' ? 'Welcome Back' : 'Join VeriFi'}
        </h2>

        {(error || validationError) && (
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
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {type === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User 
                  size={16} 
                  style={{ position: 'absolute', left: '14px', top: '14px', color: '#6B7280' }} 
                />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  style={{ paddingLeft: '42px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={16} 
                style={{ position: 'absolute', left: '14px', top: '14px', color: '#6B7280' }} 
              />
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                style={{ paddingLeft: '42px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                style={{ position: 'absolute', left: '14px', top: '14px', color: '#6B7280' }} 
              />
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: '42px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Loading...' 
              : type === 'login' 
                ? 'Sign In' 
                : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-switch-text">
          {type === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button 
            className="auth-switch-link"
            onClick={() => setModalType(type === 'login' ? 'register' : 'login')}
            disabled={isSubmitting}
          >
            {type === 'login' ? 'Register here' : 'Sign in here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModals;
