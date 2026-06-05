import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, LogOut, LogIn, UserPlus } from 'lucide-react';

const Header = ({ onOpenLogin, onOpenRegister, onAddVenueClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header-glass glass">
      <div className="logo-container" onClick={() => window.location.reload()}>
        <Wifi className="logo-icon" size={28} />
        <span className="logo-text">VeriFi</span>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <button className="btn btn-outline-cyan" onClick={onAddVenueClick}>
              Add Venue
            </button>
            <div className="user-profile-btn">
              <div className="avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>{user.name}</span>
            </div>
            <button 
              className="btn-icon-only" 
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onOpenLogin}>
              <LogIn size={16} />
              Sign In
            </button>
            <button className="btn btn-primary" onClick={onOpenRegister}>
              <UserPlus size={16} />
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
