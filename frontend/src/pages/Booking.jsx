import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CalendarView from '../components/CalendarView';
import LoadingSpinner from '../components/LoadingSpinner';
import scheduleService from '../services/scheduleService';
import bookingService from '../services/bookingService';
import { validateBookingForm, validateContactInfo, validateIntakeInfo } from '../utils/validators';
import { SEX_OPTIONS, EXPERIENCE_LEVEL_OPTIONS, HELP_NEEDED_OPTIONS } from '../utils/constants';

const initialForm = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  age: '',
  sex: '',
  gymSetup: '',
  weeklyCommitmentDays: '',
  experienceLevel: '',
  goals: '',
  helpNeeded: [],
  helpNeededOther: '',
  intakeNotes: '',
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

const formatPrice = (price) =>
  Number(price) === 0 ? 'FREE' : `$${price}`;

const stepVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ?  28 : -28 }),
  center:             { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -28 :  28 }),
};

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
  const [selectedDay, setSelectedDay]           = useState(null);
  const [detailsStep, setDetailsStep]           = useState(1);
  const [macroStep, setMacroStep]               = useState(1);
  const [direction, setDirection]               = useState(1);

  const selectedType = sessionTypes.find((t) => t.id === selectedTypeId);
  const isFree = Boolean(selectedType && Number(selectedType.price) === 0);

  const STEPS = [
    { id: 1, label: 'Session' },
    { id: 2, label: 'Date & Time' },
    { id: 3, label: 'Your Details' },
    { id: 4, label: isFree ? 'Confirm' : 'Payment' },
  ];

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
    id: iso, startTime: iso, status: 'available',
  }));

  const handleDayClick = useCallback(({ date, events, dateKey }) => {
    const slots = events
      .filter((e) => e.status === 'available')
      .map((e) => e.startTime)
      .sort();
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    setSelectedDay({ dateKey, dateLabel, slots });
    if (window.innerWidth >= 641) window.scrollTo({ top: 100, behavior: 'smooth' });
  }, []);

  const handleSlotSelect = (iso) => {
    setSelectedSlot(iso);
    setSelectedDay(null);
    setBookingError(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleHelpNeededToggle = (value) => {
    setForm((prev) => {
      const isChecked = prev.helpNeeded.includes(value);
      const helpNeeded = isChecked
        ? prev.helpNeeded.filter((v) => v !== value)
        : [...prev.helpNeeded, value];
      const helpNeededOther = value === 'OTHER' && isChecked ? '' : prev.helpNeededOther;
      return { ...prev, helpNeeded, helpNeededOther };
    });
  };

  const goToStep = (step) => {
    setDirection(step > macroStep ? 1 : -1);
    setMacroStep(step);
    setSelectedDay(null);
  };

  const handleContinueFromSession = () => {
    if (!selectedTypeId) { setErrors({ sessionTypeId: 'Please select a session type' }); return; }
    setErrors({});
    goToStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueFromDateTime = () => {
    if (!selectedSlot) { setBookingError('Please select a time slot from the calendar.'); return; }
    setBookingError(null);
    goToStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToIntake = () => {
    const { isValid, errors: contactErrors } = validateContactInfo(form);
    if (!isValid) { setErrors(contactErrors); return; }
    setErrors({});
    setDetailsStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToContact = () => {
    setErrors({});
    setDetailsStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToReview = () => {
    const { isValid, errors: intakeErrors } = validateIntakeInfo(form);
    if (!isValid) { setErrors(intakeErrors); return; }
    setErrors({});
    goToStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bookingData = {
      ...form,
      age: form.age === '' ? '' : Number(form.age),
      weeklyCommitmentDays: form.weeklyCommitmentDays === '' ? '' : Number(form.weeklyCommitmentDays),
      sessionTypeId: selectedTypeId,
      startTime: selectedSlot,
    };
    const { isValid, errors: validationErrors } = validateBookingForm(bookingData);

    if (!isValid) {
      setErrors(validationErrors);
      if (validationErrors.sessionTypeId)                                                    { goToStep(1); }
      else if (validationErrors.startTime)                                                   { goToStep(2); }
      else if (validationErrors.clientName || validationErrors.clientEmail || validationErrors.clientPhone) {
        setDetailsStep(1); goToStep(3);
      } else { setDetailsStep(2); goToStep(3); }
      return;
    }

    setErrors({});
    setBookingError(null);
    setIsSubmitting(true);

    try {
      const booking = await bookingService.reserve(bookingData);
      if (isFree) {
        // Backend confirmed the booking immediately — no Stripe needed.
        window.location.href = `${window.location.origin}/success`;
      } else {
        const stripeUrl = await bookingService.checkout(booking.id);
        window.location.href = stripeUrl;
      }
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepDone = (id) => {
    if (id === 1) return Boolean(selectedTypeId);
    if (id === 2) return Boolean(selectedSlot);
    if (id === 3) return macroStep > 3;
    return false;
  };

  return (
    <main className="booking-page">
      <h1>Book a <span>Session</span></h1>
      {loadingTypes && <LoadingSpinner />}
      {!loadingTypes && (
        <>
          {fetchError && <p className="error-message">{fetchError}</p>}

          <form className="booking-shell" onSubmit={handleSubmit}>

            {/* ── Persistent summary panel ─────────────────────── */}
            <aside className="booking-summary-panel">
              <h2 className="summary-heading">Your Booking</h2>

              <ol className="summary-step-tracker">
                {STEPS.map((step) => {
                  const done = stepDone(step.id);
                  const active = macroStep === step.id;
                  const clickable = done || active;
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={`summary-step-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                        disabled={!clickable}
                        onClick={() => clickable && goToStep(step.id)}
                      >
                        <span className="summary-step-index">{done && !active ? '✓' : step.id}</span>
                        {step.label}
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="summary-details">
                {selectedType ? (
                  <div className="summary-line">
                    <span className="summary-label">Session</span>
                    <span className="summary-value">{selectedType.name}</span>
                  </div>
                ) : (
                  <p className="summary-empty-hint">Select a session type to get started.</p>
                )}
                {selectedSlot && (
                  <div className="summary-line">
                    <span className="summary-label">When</span>
                    <span className="summary-value mono">{formatDateTime(selectedSlot)}</span>
                  </div>
                )}
                {selectedType && (
                  <div className="summary-total">
                    <span className="summary-label">Total</span>
                    <span className={`summary-total-value mono ${isFree ? 'summary-total-free' : ''}`}>
                      {formatPrice(selectedType.price)}
                    </span>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Active step panel ────────────────────────────── */}
            <div className="booking-step-panel">
              <AnimatePresence mode="wait" custom={direction} initial={false}>

                {/* Step 1 — Session selection */}
                {macroStep === 1 && (
                  <motion.section
                    key="step-1" className="step-content" custom={direction}
                    variants={stepVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h2>Select a Session</h2>
                    <div className="session-tile-grid">
                      {sessionTypes.map((type) => (
                        <button
                          type="button" key={type.id}
                          className={`session-tile ${selectedTypeId === type.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTypeId(type.id)}
                        >
                          <span className="session-tile-name">{type.name}</span>
                          <span className="session-tile-duration">{type.durationMinutes}<small>min</small></span>
                          <span className={`session-tile-price mono ${Number(type.price) === 0 ? 'session-tile-price--free' : ''}`}>
                            {formatPrice(type.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {errors.sessionTypeId && <p className="field-error">{errors.sessionTypeId}</p>}
                    <div className="step-nav-buttons">
                      <button type="button" className="cta-button" onClick={handleContinueFromSession}>
                        Continue
                      </button>
                    </div>
                  </motion.section>
                )}

                {/* Step 2 — Date & Time */}
                {macroStep === 2 && (
                  <motion.section
                    key="step-2" className="step-content" custom={direction}
                    variants={stepVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h2>Choose a Date &amp; Time</h2>

                    {selectedSlot && (
                      <div className="selected-slot-banner">
                        Selected: <strong className="mono">{formatDateTime(selectedSlot)}</strong>
                        {selectedType && ` — ${selectedType.name}`}
                        <button type="button" className="clear-slot-btn" onClick={() => setSelectedSlot(null)}>
                          Change
                        </button>
                      </div>
                    )}

                    {selectedDay && (
                      <div className="slot-panel">
                        <div className="slot-panel-header">
                          <button className="slot-panel-back" onClick={() => setSelectedDay(null)}>← Back</button>
                          <h3 className="slot-panel-title">{selectedDay.dateLabel}</h3>
                        </div>
                        {selectedDay.slots.length === 0 ? (
                          <p className="slot-panel-empty">No available slots for this day.</p>
                        ) : (
                          <div className="slot-panel-list">
                            {selectedDay.slots.map((iso) => (
                              <button
                                key={iso}
                                className={`slot-option${selectedSlot === iso ? ' selected' : ''}`}
                                onClick={() => handleSlotSelect(iso)}
                              >
                                {formatTime(iso)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`calendar-wrapper${selectedDay ? ' day-selected' : ''}`}>
                      <CalendarView
                        events={calendarEvents}
                        onDayClick={handleDayClick}
                        selectedSlot={selectedSlot}
                        selectedDateKey={selectedDay?.dateKey}
                        mode="public"
                        loading={loadingSlots}
                      />
                    </div>
                    {!loadingSlots && availableSlots.length === 0 && (
                      <p className="calendar-hint">No available slots in this period. Try navigating to a future month.</p>
                    )}
                    {errors.startTime && <p className="field-error">{errors.startTime}</p>}
                    {bookingError && <p className="error-message">{bookingError}</p>}

                    <div className={`step-nav-buttons${selectedDay ? ' slot-panel-active' : ''}`}>
                      <button type="button" className="step-back-btn" onClick={() => { goToStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Back</button>
                      <button type="button" className="cta-button" onClick={handleContinueFromDateTime}>
                        Continue
                      </button>
                    </div>
                  </motion.section>
                )}

                {/* Step 3 — Your Details (contact + intake) */}
                {macroStep === 3 && (
                  <motion.section
                    key="step-3" className="step-content" custom={direction}
                    variants={stepVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h2>Your Details</h2>

                    <div className="sub-stepper">
                      <span className={`sub-step ${detailsStep === 1 ? 'active' : 'done'}`}>
                        <span className="sub-step-index">{detailsStep === 1 ? '1' : '✓'}</span>
                        Contact Info
                      </span>
                      <span className="sub-step-divider" />
                      <span className={`sub-step ${detailsStep === 2 ? 'active' : ''}`}>
                        <span className="sub-step-index">2</span>
                        Fitness Intake
                      </span>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      {detailsStep === 1 && (
                        <motion.div
                          key="contact" className="sub-step-panel"
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="form-group">
                            <label htmlFor="clientName">Full Name</label>
                            <input id="clientName" type="text" name="clientName"
                              value={form.clientName} onChange={handleFormChange}
                              placeholder="John Watkins" required />
                            {errors.clientName && <p className="field-error">{errors.clientName}</p>}
                          </div>
                          <div className="form-group">
                            <label htmlFor="clientEmail">Email Address</label>
                            <input id="clientEmail" type="email" name="clientEmail"
                              value={form.clientEmail} onChange={handleFormChange}
                              placeholder="johnwatkins@example.com" required />
                            {errors.clientEmail && <p className="field-error">{errors.clientEmail}</p>}
                          </div>
                          <div className="form-group">
                            <label htmlFor="clientPhone">Phone Number</label>
                            <input id="clientPhone" type="tel" name="clientPhone"
                              value={form.clientPhone} onChange={handleFormChange}
                              placeholder="(555) 000-0000" required />
                            {errors.clientPhone && <p className="field-error">{errors.clientPhone}</p>}
                          </div>
                          <div className="step-nav-buttons">
                            <button type="button" className="step-back-btn" onClick={() => { goToStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Back</button>
                            <button type="button" className="cta-button" onClick={handleContinueToIntake}>
                              Continue to Fitness Intake
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {detailsStep === 2 && (
                        <motion.div
                          key="intake" className="sub-step-panel"
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="form-group">
                            <label htmlFor="age">Age</label>
                            <input id="age" type="number" name="age" min="13" max="110"
                              value={form.age} onChange={handleFormChange}
                              placeholder="28" required />
                            {errors.age && <p className="field-error">{errors.age}</p>}
                          </div>

                          <div className="form-group">
                            <label>Sex</label>
                            {SEX_OPTIONS.map((opt) => (
                              <label key={opt.value} className="radio-label">
                                <input type="radio" name="sex" value={opt.value}
                                  checked={form.sex === opt.value} onChange={handleFormChange} />
                                {opt.label}
                              </label>
                            ))}
                            {errors.sex && <p className="field-error">{errors.sex}</p>}
                          </div>

                          <div className="form-group">
                            <label htmlFor="gymSetup">Gym Set Up</label>
                            <p className="field-hint">Full commercial gym, apartment gym, home gym, or none — feel free to list out equipment too.</p>
                            <textarea id="gymSetup" name="gymSetup"
                              value={form.gymSetup} onChange={handleFormChange}
                              placeholder="e.g. Home gym with a rack, barbell, and adjustable dumbbells"
                              rows={3} required />
                            {errors.gymSetup && <p className="field-error">{errors.gymSetup}</p>}
                          </div>

                          <div className="form-group">
                            <label htmlFor="weeklyCommitmentDays">How many days can you commit to training a week?</label>
                            <select id="weeklyCommitmentDays" name="weeklyCommitmentDays"
                              value={form.weeklyCommitmentDays} onChange={handleFormChange} required>
                              <option value="" disabled>Select days per week</option>
                              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                            {errors.weeklyCommitmentDays && <p className="field-error">{errors.weeklyCommitmentDays}</p>}
                          </div>

                          <div className="form-group">
                            <label>Fitness Level</label>
                            {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                              <label key={opt.value} className="radio-label">
                                <input type="radio" name="experienceLevel" value={opt.value}
                                  checked={form.experienceLevel === opt.value} onChange={handleFormChange} />
                                {opt.label}
                              </label>
                            ))}
                            {errors.experienceLevel && <p className="field-error">{errors.experienceLevel}</p>}
                          </div>

                          <div className="form-group">
                            <label htmlFor="goals">Goals</label>
                            <p className="field-hint">Anything that comes to mind regarding fitness and nutrition.</p>
                            <textarea id="goals" name="goals"
                              value={form.goals} onChange={handleFormChange}
                              placeholder="e.g. Lose fat while keeping strength, build a sustainable nutrition routine"
                              rows={4} required />
                            {errors.goals && <p className="field-error">{errors.goals}</p>}
                          </div>

                          <div className="form-group">
                            <label>What do you need help most with?</label>
                            <div className="checkbox-grid">
                              {HELP_NEEDED_OPTIONS.map((opt) => (
                                <label key={opt.value} className="checkbox-pill">
                                  <input type="checkbox"
                                    checked={form.helpNeeded.includes(opt.value)}
                                    onChange={() => handleHelpNeededToggle(opt.value)} />
                                  {opt.label}
                                </label>
                              ))}
                            </div>
                            {errors.helpNeeded && <p className="field-error">{errors.helpNeeded}</p>}
                            {form.helpNeeded.includes('OTHER') && (
                              <div className="form-group help-needed-other">
                                <label htmlFor="helpNeededOther">Please specify</label>
                                <input id="helpNeededOther" type="text" name="helpNeededOther"
                                  value={form.helpNeededOther} onChange={handleFormChange}
                                  placeholder="What else do you need help with?" />
                                {errors.helpNeededOther && <p className="field-error">{errors.helpNeededOther}</p>}
                              </div>
                            )}
                          </div>

                          <div className="form-group">
                            <label htmlFor="intakeNotes">Anything else you&apos;d like me to know about you? (optional)</label>
                            <textarea id="intakeNotes" name="intakeNotes"
                              value={form.intakeNotes} onChange={handleFormChange}
                              placeholder="Any injuries, scheduling constraints, or questions for Everett"
                              rows={3} />
                          </div>

                          <div className="step-nav-buttons">
                            <button type="button" className="step-back-btn" onClick={handleBackToContact}>
                              ← Back to Contact Info
                            </button>
                            <button type="button" className="cta-button" onClick={handleContinueToReview}>
                              {isFree ? 'Review Booking' : 'Continue to Payment'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}

                {/* Step 4 — Confirm (free) or Review & Pay (paid) */}
                {macroStep === 4 && (
                  <motion.section
                    key="step-4" className="step-content" custom={direction}
                    variants={stepVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h2>{isFree ? 'Review & Confirm' : 'Review & Pay'}</h2>

                    <div className="review-grid">
                      <span className="summary-label">Name</span>
                      <span>{form.clientName}</span>
                      <span className="summary-label">Session</span>
                      <span>{selectedType?.name}</span>
                      <span className="summary-label">When</span>
                      <span className="mono">{selectedSlot && formatDateTime(selectedSlot)}</span>
                      <span className="summary-label">Total</span>
                      <span className={`mono review-total ${isFree ? 'review-total--free' : ''}`}>
                        {formatPrice(selectedType?.price)}
                      </span>
                    </div>

                    {isFree ? (
                      <p className="free-confirmation-note">
                        No payment required. Your consultation will be confirmed immediately and Everett will reach out before your session.
                      </p>
                    ) : (
                      <div id="stripe-placeholder">
                        <p>You will be redirected to Stripe to complete payment after submitting.</p>
                      </div>
                    )}

                    {bookingError && <p className="error-message">{bookingError}</p>}

                    <div className="step-nav-buttons">
                      <button type="button" className="step-back-btn" onClick={() => { goToStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Back</button>
                      <button type="submit" className="cta-button booking-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing…' : isFree ? 'Book Free Consultation' : 'Reserve & Pay'}
                      </button>
                    </div>
                  </motion.section>
                )}

              </AnimatePresence>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
