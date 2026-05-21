import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Booking from './pages/Booking';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Cancel from './pages/Cancel';
import BookingSuccess from './pages/BookingSuccess';

// Admin pages
import Dashboard from './pages/Admin/Dashboard';
import ManageBookings from './pages/Admin/ManageBookings';
import ManageSchedule from './pages/Admin/ManageSchedule';
import ManageContent from './pages/Admin/ManageContent';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ErrorBoundary>
          <Navigation />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cancel/:token" element={<Cancel />} />
            <Route path="/success" element={<BookingSuccess />} />

            {/* Admin (protected) */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><ManageBookings /></ProtectedRoute>} />
            <Route path="/admin/schedule" element={<ProtectedRoute><ManageSchedule /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute><ManageContent /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
