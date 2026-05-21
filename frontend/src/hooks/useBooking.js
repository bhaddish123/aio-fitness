import { useState } from 'react';
import bookingService from '../services/bookingService';
import { validateBookingForm } from '../utils/validators';

const initialForm = {
  sessionTypeId: '',
  startTime: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  intakeNotes: '',
  waiverAccepted: false,
};

/**
 * Hook managing the booking form state and submission flow.
 * Returns: { form, setForm, errors, isSubmitting, bookingError, submitBooking }
 */
export function useBooking() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  /**
   * Validates, reserves the slot, then redirects to Stripe checkout.
   */
  const submitBooking = async () => {
    const { isValid, errors: validationErrors } = validateBookingForm(form);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setBookingError(null);

    try {
      // Step 1: Reserve the slot
      const booking = await bookingService.reserve(form);
      console.log('[useBooking] Slot reserved:', booking.id);

      // Step 2: Create Stripe checkout session and redirect
      const stripeUrl = await bookingService.checkout(booking.id);
      console.log('[useBooking] Redirecting to Stripe:', stripeUrl);
      window.location.href = stripeUrl;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Booking failed. Please try again.';
      setBookingError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, setForm, errors, isSubmitting, bookingError, submitBooking };
}
