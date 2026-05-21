import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BOOKING_STATUS } from '../../utils/constants';

const PAGE_SIZE = 10;

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    bookingService.getAllBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleStatusUpdate = async (id, status) => {
    setActionError(null);
    try {
      await bookingService.updateBooking(id, { status });
      fetchBookings();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data || err?.message || 'Unknown error';
      setActionError(`Failed to update booking status: ${msg}`);
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Cancel this booking and issue a Stripe refund?')) return;
    setActionError(null);
    try {
      await bookingService.refundBooking(id);
      fetchBookings();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data || err?.message || 'Unknown error';
      setActionError(`Failed to process refund: ${msg}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="error-message">{error}</p>;

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const paginated = bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <main className="manage-bookings">
      <Link to="/admin/dashboard" style={{ fontSize: 14, color: 'var(--blue)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back</Link>
      <h1>Manage Bookings</h1>

      {actionError && <p className="error-message">{actionError}</p>}

      <table className="bookings-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Email</th>
            <th>Session</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.clientName}</td>
              <td>{booking.clientEmail}</td>
              <td>{booking.sessionType?.name}</td>
              <td>{new Date(booking.startTime).toLocaleString()}</td>
              <td>{booking.status}</td>
              <td className="action-buttons">
                <button onClick={() => setSelectedBooking(booking)}>Details</button>
                {booking.status === BOOKING_STATUS.CONFIRMED && (
                  <button
                    onClick={() => {
                      if (window.confirm('Cancel this booking? No refund will be issued.')) {
                        handleStatusUpdate(booking.id, BOOKING_STATUS.CANCELLED);
                      }
                    }}
                  >
                    Cancel
                  </button>
                )}
                {booking.status === BOOKING_STATUS.CONFIRMED && (
                  <button onClick={() => handleRefund(booking.id)}>
                    Cancel + Refund
                  </button>
                )}
                {booking.status === BOOKING_STATUS.CONFIRMED && (
                  <button
                    onClick={() => {
                      if (window.confirm('Mark this session as completed?')) {
                        handleStatusUpdate(booking.id, 'COMPLETED');
                      }
                    }}
                  >
                    Mark Complete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Booking Details</h2>
            <div className="booking-details-grid">
              <span className="detail-label">Name</span>
              <span>{selectedBooking.clientName}</span>

              <span className="detail-label">Email</span>
              <span>{selectedBooking.clientEmail}</span>

              <span className="detail-label">Phone</span>
              <span>{selectedBooking.clientPhone || '—'}</span>

              <span className="detail-label">Session</span>
              <span>{selectedBooking.sessionType?.name}</span>

              <span className="detail-label">Date & Time</span>
              <span>{new Date(selectedBooking.startTime).toLocaleString()}</span>

              <span className="detail-label">Status</span>
              <span>{selectedBooking.status}</span>

              <span className="detail-label">Waiver</span>
              <span>{selectedBooking.waiverAccepted ? 'Accepted' : 'Not accepted'}</span>

              <span className="detail-label">Notes</span>
              <span>{selectedBooking.intakeNotes || '—'}</span>
            </div>
            <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
