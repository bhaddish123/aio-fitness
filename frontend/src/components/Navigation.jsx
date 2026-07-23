import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/a1logo-transparent.png';

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(window.scrollY > 60);
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Transparent over the hero at the top of the page, solid backdrop
  // once scrolled past it — avoids the nav text colliding with page
  // content that scrolls underneath a permanently transparent nav.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Dragging the window across the mobile breakpoint changes the dropdown's
  // computed max-height, which would otherwise animate and flash the closed
  // menu's first item over the page. Suppress that transition while resizing.
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      document.documentElement.classList.add('nav-resizing');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.documentElement.classList.remove('nav-resizing');
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

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
    <header className={`nav-header ${scrolled ? 'nav-header-scrolled' : ''}`}>
      <nav className="nav-container">

        {/* Left group — brand + primary links sit together, no central void */}
        <div className="nav-left-group">
          <div className="nav-brand">
            <Link to="/" className="nav-brand-link" aria-label="AIO Fitness — Home" onClick={() => handleNav('/')}>
              <span className="nav-logo-badge">
                <span
                  className="nav-logo-icon"
                  role="img"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${logo})` }}
                />
              </span>
              <span className="nav-wordmark">
                <span className="nav-wordmark-line1">All In One</span>
                <span className="nav-wordmark-line2">Fitness</span>
              </span>
            </Link>
          </div>

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
              to="/coaching"
              aria-current={isActive('/coaching') ? 'page' : undefined}
              onClick={() => handleNav('/coaching')}
            >Coaching</Link>
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
                LOGOUT
              </button>
            )}
            {/* Shown only in mobile dropdown */}
            <Link
              to="/booking"
              className="nav-links-mobile-cta"
              onClick={() => handleNav('/booking')}
            >Free Consultation</Link>
          </div>
        </div>

        {/* Right — isolated CTA focal point + hamburger */}
        <div className="nav-right">
          <Link to="/booking" className="nav-cta" onClick={() => handleNav('/booking')}>
            Free Consultation
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
