import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/A1_logo_transparent.png';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/coaching', label: 'Coaching' },
  { to: '/results', label: 'Results' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleNav = (to) => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: pathname === to ? 'smooth' : 'instant' });
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const links = isAuthenticated
    ? [...LINKS, { to: '/admin/dashboard', label: 'Dashboard' }]
    : LINKS;

  return (
    <div className="rd">
      <div className="progress" aria-hidden="true" />
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="All In One Fitness — Home" onClick={() => handleNav('/')}>
            <span className="mark round"><img src={logo} alt="" /></span>
            <span className="wordmark"><b>All In One</b><span>Fitness</span></span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined} onClick={() => handleNav(to)}>
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
            )}
          </nav>

          <div className="nav-right">
            <Link to="/booking" className="btn btn-gold nav-cta" onClick={() => handleNav('/booking')}>
              <span className="pulse-dot" aria-hidden="true" />Free Consultation
            </Link>
            <button
              type="button"
              className="menu-btn"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
            </button>
          </div>

          {menuOpen && (
            <div className="mobile-menu">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => handleNav(to)}>{label}</Link>
              ))}
              {isAuthenticated && (
                <button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
              )}
              <Link to="/booking" className="btn btn-gold btn-block" onClick={() => handleNav('/booking')}>
                Free Consultation
              </Link>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
