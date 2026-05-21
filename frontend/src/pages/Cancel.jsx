import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookingService from '../services/bookingService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Cancel() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid cancellation link.');
      return;
    }

    bookingService.cancelByToken(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.response?.data?.error || 'Cancellation failed. The link may have already been used or expired.');
      });
  }, [token]);

  if (status === 'loading') return <LoadingSpinner />;

  return (
    <main className="not-found">
      {status === 'success' ? (
        <>
          <h1>Booking Cancelled</h1>
          <p>Your session has been successfully cancelled. A refund will be processed if applicable.</p>
          <Link to="/" className="cta-button">Back to Home</Link>
        </>
      ) : (
        <>
          <h1>Cancellation Failed</h1>
          <p>{errorMessage}</p>
          <Link to="/" className="cta-button">Back to Home</Link>
        </>
      )}
    </main>
  );
}
