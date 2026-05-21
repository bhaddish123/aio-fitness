import { Link } from 'react-router-dom';

export default function BookingSuccess() {
  return (
    <main style={{ textAlign: 'center', padding: '120px 32px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>You're booked!</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 40, lineHeight: 1.6 }}>
        Payment confirmed. Check your email for your session details.
      </p>
      <Link to="/">
        <button className="cta-button">Back to Home</button>
      </Link>
    </main>
  );
}
