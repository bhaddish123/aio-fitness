import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import StickySocialSidebar from './components/StickySocialSidebar';
import ContactFormSection from './components/ContactFormSection';
import ScrollToTop from './components/ScrollToTop';
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
import OnlineCoaching from './pages/OnlineCoaching';
import CoachingApply from './pages/CoachingApply';

// Admin pages
import Dashboard from './pages/Admin/Dashboard';
import ManageBookings from './pages/Admin/ManageBookings';
import ManageSchedule from './pages/Admin/ManageSchedule';
import ManageContent from './pages/Admin/ManageContent';
function AppContent() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const hideFooterChrome = isAdminRoute || pathname.startsWith('/booking');

  return (
    <>
      <Navigation />
      <StickySocialSidebar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/coaching" element={<OnlineCoaching />} />
        <Route path="/coaching/apply" element={<CoachingApply />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cancel/:token" element={<Cancel />} />
        <Route path="/success" element={<BookingSuccess />} />

        {/* Admin (protected) */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute><ManageBookings /></ProtectedRoute>} />
        <Route path="/admin/schedule" element={<ProtectedRoute><ManageSchedule /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute><ManageContent /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Marketing footer/contact form don't belong on internal admin
          screens — also avoids the flash where they'd render instantly
          while the protected route's auth check + data fetch are still
          pending behind a loading spinner. Also hidden during the
          booking flow, which is its own focused, multi-step task. */}
      {!hideFooterChrome && <ContactFormSection />}
      {!hideFooterChrome && <Footer />}
      <ScrollToTop />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
