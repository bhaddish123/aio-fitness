import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleNav = (to) => {
    setMenuOpen(false);
    if (pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isActive = (to) => pathname === to;

  return (
    <header className="nav-header">
      <nav className="nav-container">

        {/* Logo — left */}
        <div className="nav-brand">
          <Link to="/" onClick={() => handleNav('/')}>
            <img src={logo} alt="A3 Fitness" className="nav-logo" />
          </Link>
        </div>

        {/* Center links */}
        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <Link
            to="/"
            aria-current={isActive('/') ? 'page' : undefined}
            onClick={() => handleNav('/')}
          >Home</Link>
          <Link
            to="/about"
            aria-current={isActive('/about') ? 'page' : undefined}
            onClick={() => handleNav('/about')}
          >About</Link>
          <Link
            to="/faq"
            aria-current={isActive('/faq') ? 'page' : undefined}
            onClick={() => handleNav('/faq')}
          >FAQ</Link>
          {isAuthenticated && (
            <Link
              to="/admin/dashboard"
              aria-current={isActive('/admin/dashboard') ? 'page' : undefined}
              onClick={() => handleNav('/admin/dashboard')}
            >Dashboard</Link>
          )}
          {isAuthenticated && (
            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
          {/* Shown only in mobile dropdown */}
          <Link
            to="/booking"
            className="nav-links-mobile-cta"
            onClick={() => handleNav('/booking')}
          >Book Now</Link>
        </div>

        {/* Right — CTA button + hamburger */}
        <div className="nav-right">
          <Link to="/booking" className="nav-cta" onClick={() => handleNav('/booking')}>
            Book Now
          </Link>
          <button
            className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

      </nav>
    </header>
  );
}
