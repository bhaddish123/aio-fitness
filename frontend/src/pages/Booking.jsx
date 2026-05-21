import { useEffect, useState, useCallback } from 'react';
import CalendarView from '../components/CalendarView';
import LoadingSpinner from '../components/LoadingSpinner';
import scheduleService from '../services/scheduleService';
import bookingService from '../services/bookingService';
import { validateBookingForm } from '../utils/validators';
import { useInView } from '../hooks/useInView';


const initialForm = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  intakeNotes: '',
  waiverAccepted: false,
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const localDateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY_DAY_MODAL = { open: false, dateLabel: '', slots: [] };

export default function Booking() {
  const [sessionTypes, setSessionTypes]         = useState([]);
  const [selectedTypeId, setSelectedTypeId]     = useState('');
  const [availableSlots, setAvailableSlots]     = useState([]);
  const [selectedSlot, setSelectedSlot]         = useState(null);
  const [form, setForm]                         = useState(initialForm);
  const [errors, setErrors]                     = useState({});
  const [loadingTypes, setLoadingTypes]         = useState(true);
  const [loadingSlots, setLoadingSlots]         = useState(false);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [fetchError, setFetchError]             = useState(null);
  const [bookingError, setBookingError]         = useState(null);
  const [dayModal, setDayModal]                 = useState(EMPTY_DAY_MODAL);
  const [heroRef, heroInView] = useInView();



  useEffect(() => {
    scheduleService.getSessionTypes()
      .then(setSessionTypes)
      .catch(() => setFetchError('Failed to load session types. Please refresh the page.'))
      .finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (!selectedTypeId) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    scheduleService.getAvailableSlots(selectedTypeId)
      .then(setAvailableSlots)
      .catch(() => setFetchError('Failed to load available times. Please try again.'))
      .finally(() => setLoadingSlots(false));
  }, [selectedTypeId]);

  const calendarEvents = availableSlots.map((iso) => ({
    id: iso,
    startTime: iso,
    status: 'available',
  }));

  const closeDayModal = useCallback(() => {
    setDayModal(EMPTY_DAY_MODAL);
    document.body.style.overflow = '';
  }, []);

  const openDayModal = useCallback(({ date, dateKey: dk }) => {
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    const slots = availableSlots.filter((iso) => localDateKey(iso) === dk);
    setDayModal({ open: true, dateLabel, slots });
    document.body.style.overflow = 'hidden';
  }, [availableSlots]);

  const handleModalSlotSelect = (iso) => {
    setSelectedSlot(iso);
    setBookingError(null);
    closeDayModal();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeDayModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDayModal]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const selectedType = sessionTypes.find((t) => t.id === selectedTypeId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bookingData = { ...form, sessionTypeId: selectedTypeId, startTime: selectedSlot };
    const { isValid, errors: validationErrors } = validateBookingForm(bookingData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select a time slot from the calendar.');
      return;
    }

    setErrors({});
    setBookingError(null);
    setIsSubmitting(true);

    try {
      const booking = await bookingService.reserve(bookingData);
      const stripeUrl = await bookingService.checkout(booking.id);
      window.location.href = stripeUrl;
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="booking-page">
      <h1 ref={heroRef} className={`animate-fade-in-up${heroInView ? ' in-view' : ''}`}>Book a Session</h1>
      {loadingTypes && <LoadingSpinner />}
      {!loadingTypes && <>


      {fetchError && <p className="error-message">{fetchError}</p>}

      <form className="booking-form" onSubmit={handleSubmit}>

      <section className="form-section">
          <h2>1. Select Session Type</h2>
          {sessionTypes.map((type) => (
            <label key={type.id} className="radio-label">
              <input
                type="radio"
                name="sessionTypeId"
                value={type.id}
                checked={selectedTypeId === type.id}
                onChange={(e) => setSelectedTypeId(e.target.value)}
              />
              {type.durationMinutes} min — ${type.price}
            </label>
          ))}
          {errors.sessionTypeId && <p className="field-error">{errors.sessionTypeId}</p>}
        </section>

        <section className="form-section">
          <h2>2. Choose a Date & Time</h2>
          {!selectedTypeId && (
            <p className="calendar-hint">Select a session type above to see available times.</p>
          )}
          {selectedTypeId && (
            <>
              {selectedSlot && (
                <div className="selected-slot-banner">
                  Selected: <strong>{new Date(selectedSlot).toLocaleString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}</strong>
                  {selectedType && ` — ${selectedType.durationMinutes} min`}
                  <button
                    type="button"
                    className="clear-slot-btn"
                    onClick={() => setSelectedSlot(null)}
                  >
                    Change
                  </button>
                </div>
              )}
              <CalendarView
                events={calendarEvents}
                onDayClick={openDayModal}
                selectedSlot={selectedSlot}
                mode="public"
                loading={loadingSlots}
              />
              {!loadingSlots && availableSlots.length === 0 && (
                <p className="calendar-hint">No available slots in this period. Try navigating to a future month.</p>
              )}
            </>
          )}
          {errors.startTime && <p className="field-error">{errors.startTime}</p>}
        </section>

        {selectedSlot && (
          <section className="form-section">
            <h2>3. Your Details</h2>

            <div className="form-group">
              <label htmlFor="clientName">Full Name</label>
              <input
                id="clientName" type="text" name="clientName"
                value={form.clientName} onChange={handleFormChange}
                placeholder="John Watkins" required
              />
              {errors.clientName && <p className="field-error">{errors.clientName}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">Email Address</label>
              <input
                id="clientEmail" type="email" name="clientEmail"
                value={form.clientEmail} onChange={handleFormChange}
                placeholder="johnwatkins@example.com" required
              />
              {errors.clientEmail && <p className="field-error">{errors.clientEmail}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="clientPhone">Phone Number</label>
              <input
                id="clientPhone" type="tel" name="clientPhone"
                value={form.clientPhone} onChange={handleFormChange}
                placeholder="(555) 000-0000" required
              />
              {errors.clientPhone && <p className="field-error">{errors.clientPhone}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="intakeNotes">Notes (optional)</label>
              <textarea
                id="intakeNotes" name="intakeNotes"
                value={form.intakeNotes} onChange={handleFormChange}
                placeholder="Any injuries, goals, or questions for Drew"
                rows={4}
              />
            </div>

            <div className="waiver-block">
              <h3 className="waiver-title">Liability Waiver &amp; Policies</h3>
              <div className="waiver-body">
                <p><strong>Assumption of Risk</strong><br />
                I voluntarily participate in personal training sessions with A3 Fitness and acknowledge the inherent risks of physical exercise, including the possibility of injury, illness, or harm.</p>

                <p><strong>Medical Clearance</strong><br />
                I confirm that I am in adequate physical health to participate in these sessions. If I have any known medical conditions, I have consulted or will consult a physician before training.</p>

                <p><strong>Release of Liability</strong><br />
                I release A3 Fitness and its trainer from any liability for injury, illness, or loss arising from my participation in training sessions, including claims related to negligence.</p>

                <p><strong>Cancellation &amp; Refund Policy</strong><br />
                Cancellations made more than 24 hours before a session receive a full refund. Cancellations within 24 hours of the session are non-refundable. No-shows are non-refundable.</p>
              </div>
              <label className="waiver-checkbox-label">
                <input
                  type="checkbox" name="waiverAccepted"
                  checked={form.waiverAccepted} onChange={handleFormChange}
                />
                I have read and agree to the liability waiver and cancellation policy above.
              </label>
              {errors.waiverAccepted && <p className="field-error">{errors.waiverAccepted}</p>}
            </div>
          </section>
        )}

        {selectedSlot && (
          <section className="form-section">
            <h2>4. Payment</h2>
            <div id="stripe-placeholder">
              <p>You will be redirected to Stripe to complete payment after submitting.</p>
            </div>
          </section>
        )}

        {bookingError && <p className="error-message">{bookingError}</p>}

        {selectedSlot && (
          <button type="submit" className="cta-button booking-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing…' : 'Reserve & Pay'}
          </button>
        )}

      </form>

      {dayModal.open && (
        <div className="modal-overlay" onClick={closeDayModal}>
          <div className="modal-card day-slots-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDayModal} aria-label="Close">✕</button>
            <div className="day-modal-header">
              <h2>Available Times</h2>
              <p>{dayModal.dateLabel}</p>
            </div>
            <div className="day-slot-list">
              {dayModal.slots.length === 0 ? (
                <p className="day-slot-empty">No available slots for this day.</p>
              ) : (
                dayModal.slots.map((iso, i) => (
                  <button
                    key={i}
                    className={`day-slot-row available ${selectedSlot === iso ? 'day-slot-row-selected' : ''}`}
                    onClick={() => handleModalSlotSelect(iso)}
                  >
                    <span className="day-slot-time">{formatTime(iso)}</span>
                    <span className="status-badge available">Available</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </>}
    </main>
  );
}
