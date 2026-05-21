import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BOOKING_STATUS } from '../../utils/constants';

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    bookingService.getAllBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="error-message">{error}</p>;

  const confirmed = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED);
  const upcoming = confirmed.filter((b) => new Date(b.startTime) > new Date());
  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return (
    <main className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <section className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{bookings.length}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Sessions</h3>
          <p>{upcoming.length}</p>
        </div>
        <div className="stat-card">
          <h3>Confirmed</h3>
          <p>{confirmed.length}</p>
        </div>
      </section>

      <section className="dashboard-nav">
        <h2>Manage</h2>
        <Link to="/admin/bookings">Manage Bookings</Link>
        <Link to="/admin/schedule">Manage Schedule</Link>
        <Link to="/admin/content">Manage Content</Link>
      </section>

      <section className="recent-bookings">
        <h2>Recent Bookings</h2>
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Session</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.clientName}</td>
                <td>{booking.sessionType?.name}</td>
                <td>{new Date(booking.startTime).toLocaleString()}</td>
                <td>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
