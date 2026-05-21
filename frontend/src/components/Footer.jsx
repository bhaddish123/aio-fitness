import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

/* ─── Inline SVG icons (no external dependency) ─────────────── */
const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAdminClick = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate('/login');
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" onClick={() => handleNav('/')}className="footer-logo-link">
            <img src={logo} alt="A3 Fitness" className="footer-logo" />
          </Link>
          <p className="footer-tagline">Personal training, tailored to you.</p>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3 className="footer-heading">Contact</h3>
          <a href="tel:+12676489095" className="footer-contact-item">
            <PhoneIcon />
            <span>(267) 648-9095</span>
          </a>
          <a href="mailto:drew.a3fitness@gmail.com" className="footer-contact-item">
            <EmailIcon />
            <span>drew.a3fitness@gmail.com</span>
          </a>
          <div className="footer-contact-item footer-contact-item--static">
            <LocationIcon />
            <span>Devon, PA</span>
          </div>
        </div>

        {/* Social */}
        <div className="footer-section">
          <h3 className="footer-heading">Follow</h3>
          <div className="footer-social-icons">
            <a
              href="https://www.instagram.com/drew15_/?hl=en"
              target="_blank"
              rel="noreferrer"
              aria-label="Follow on Instagram"
              className="footer-social-btn"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/andrew-ampomah-3a6234226/"
              target="_blank"
              rel="noreferrer"
              aria-label="Connect on LinkedIn"
              className="footer-social-btn"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-copy">
          <p>&copy; {new Date().getFullYear()} A3 Fitness. All rights reserved.</p>
          {!isAuthenticated && (
            <a href="/login" className="footer-admin-link" onClick={handleAdminClick}>
              Admin Login
            </a>
          )}
        </div>

      </div>
    </footer>
  );
}
