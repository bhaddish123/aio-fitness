import api from './api';
import { ENDPOINTS } from '../utils/constants';

const bookingService = {
  /**
   * POST /bookings/reserve
   * Body: { sessionTypeId, clientName, clientEmail, clientPhone, startTime, intakeNotes }
   * Returns the created Booking object
   */
  async reserve(bookingData) {
    const response = await api.post(ENDPOINTS.RESERVE, bookingData);
    return response.data;
  },

  /**
   * POST /bookings/{id}/checkout
   * Returns Stripe checkout URL (string)
   */
  async checkout(bookingId) {
    const response = await api.post(ENDPOINTS.CHECKOUT(bookingId));
    return response.data; // Stripe URL
  },

  /**
   * GET /bookings/cancel/{token}
   * Cancels a booking by its cancellation token
   */
  async cancelByToken(token) {
    const response = await api.get(ENDPOINTS.CANCEL(token));
    return response.data;
  },

  // Admin: GET /admin/bookings
  async getAllBookings() {
    const response = await api.get(ENDPOINTS.ADMIN_BOOKINGS);
    return response.data;
  },

  // Admin: PATCH /admin/bookings/{id}
  // updates can include: { status, clientName, notes }
  async updateBooking(id, updates) {
    const response = await api.patch(ENDPOINTS.ADMIN_BOOKING(id), updates);
    return response.data;
  },

  // Admin: POST /admin/bookings/{id}/refund — cancel + Stripe refund
  async refundBooking(id) {
    const response = await api.post(ENDPOINTS.ADMIN_BOOKING_REFUND(id));
    return response.data;
  },
};

export default bookingService;
