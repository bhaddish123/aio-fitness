import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CalendarView from '../../components/CalendarView';
import Toast from '../../components/Toast';
import bookingService from '../../services/bookingService';
import scheduleService from '../../services/scheduleService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BOOKING_STATUS } from '../../utils/constants';

/* ── helpers ─────────────────────────────────────────────────── */

const toStatusClass = (status) => {
  switch (status) {
    case BOOKING_STATUS.CONFIRMED: return 'confirmed';
    case BOOKING_STATUS.RESERVED:  return 'reserved';
    case 'BLOCKED':
    case 'blocked':                return 'blocked';
    case BOOKING_STATUS.CANCELLED:
    case BOOKING_STATUS.REFUNDED:  return 'cancelled';
    default:                       return 'available';
  }
};


const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

/** Generate 30-min local time options from 9:00 to 18:00 */
const generateTimeOptions = () => {
  const options = [];
  for (let h = 9; h < 18; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`);
    options.push(`${String(h).padStart(2, '0')}:30`);
  }
  return options; // ["09:00", "09:30", ..., "17:30"]
};

const TIME_OPTIONS = generateTimeOptions();

const formatLocalTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const ALL_STATUS_FILTERS = {
  [BOOKING_STATUS.CONFIRMED]: true,
  [BOOKING_STATUS.RESERVED]:  true,
  available:                   true,
  blocked:                     true,
  [BOOKING_STATUS.CANCELLED]: true,
  [BOOKING_STATUS.REFUNDED]:  true,
};

const EMPTY_MODAL = {
  open:         false,
  dateKey:      '',
  dateLabel:    '',
  daySlots:     [],
  modalLoading: false,
  selected:     null,
  checkedSlots: [],
  isLoading:    false,
  apiError:     null,
  showAddForm:   false,
  newSlotTimes:  [],
};

/* ── component ───────────────────────────────────────────────── */

export default function ManageSchedule() {
  const [bookings, setBookings]             = useState([]);
  const [sessionTypes, setSessionTypes]     = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedOverrides, setBlockedOverrides] = useState([]);
  const [filterTypeId, setFilterTypeId]     = useState('');
  const [statusFilters, setStatusFilters]   = useState(ALL_STATUS_FILTERS);
  const [loading, setLoading]               = useState(true);
  const [loadingSlots, setLoadingSlots]     = useState(false);
  const [fetchError, setFetchError]         = useState(null);
  const [toast, setToast]                   = useState(null);
  const [modal, setModal]                   = useState(EMPTY_MODAL);

  /* ── data fetching ─────────────────────────────────────────── */

  useEffect(() => {
    Promise.all([
      bookingService.getAllBookings(),
      scheduleService.getSessionTypes(),
    ])
      .then(([b, st]) => { setBookings(b); setSessionTypes(st); })
      .catch(() => setFetchError('Failed to load schedule data.'))
      .finally(() => setLoading(false));

    // Overrides are non-critical — fetch separately so a failure doesn't break the page
    scheduleService.getOverrides()
      .then((overrides) => setBlockedOverrides(overrides.filter((o) => o.blocked)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionTypes.length) return;
    setLoadingSlots(true);
    const fetches = filterTypeId
      ? [scheduleService.getAvailableSlots(filterTypeId)]
      : sessionTypes.map((st) => scheduleService.getAvailableSlots(st.id));
    Promise.all(fetches)
      .then((res) => setAvailableSlots([...new Set(res.flat())]))
      .catch(() => setFetchError('Failed to load available slots.'))
      .finally(() => setLoadingSlots(false));
  }, [filterTypeId, sessionTypes]);

  const refreshAvailableSlots = useCallback(() => {
    if (!sessionTypes.length) return;
    const fetches = filterTypeId
      ? [scheduleService.getAvailableSlots(filterTypeId)]
      : sessionTypes.map((st) => scheduleService.getAvailableSlots(st.id));
    Promise.all(fetches)
      .then((res) => setAvailableSlots([...new Set(res.flat())]))
      .catch(() => {});
  }, [filterTypeId, sessionTypes]);

  const refreshBlockedOverrides = useCallback(() => {
    scheduleService.getOverrides()
      .then((overrides) => setBlockedOverrides(overrides.filter((o) => o.blocked)))
      .catch(() => {});
  }, []);

  /* ── derived data for CalendarView display ─────────────────── */

  const defaultCalendarDate = useMemo(() => {
    if (!bookings.length) return new Date();
    return new Date([...bookings].sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    )[0].startTime);
  }, [bookings]);

  const bookedTimes = useMemo(() =>
    new Set(
      bookings
        .filter((b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.RESERVED)
        .map((b) => b.startTime)
    ), [bookings]);

  const bookingEvents = useMemo(() =>
    bookings
      .filter((b) => !filterTypeId || b.sessionType?.id === filterTypeId)
      .filter((b) => statusFilters[b.status])
      .map((b) => ({ id: b.id, startTime: b.startTime, status: b.status, label: b.clientName, data: b })),
    [bookings, filterTypeId, statusFilters]);

  const availableEvents = useMemo(() =>
    statusFilters.available
      ? availableSlots
          .filter((iso) => !bookedTimes.has(iso))
          .map((iso) => ({ id: iso, startTime: iso, status: 'available' }))
      : [],
    [availableSlots, bookedTimes, statusFilters]);

  const blockedEvents = useMemo(() =>
    statusFilters.blocked
      ? blockedOverrides.map((o) => ({ id: o.id, startTime: o.slotTime, status: 'blocked' }))
      : [],
    [blockedOverrides, statusFilters]);

  const allEvents = useMemo(
    () => [...bookingEvents, ...availableEvents, ...blockedEvents],
    [bookingEvents, availableEvents, blockedEvents],
  );

  /* ── modal helpers ─────────────────────────────────────────── */

  const showToast = (message, type = 'success') => setToast({ message, type });

  /** Fetch day slots from API and refresh the modal slot list */
  const fetchDaySlots = useCallback(async (dateKey) => {
    setModal((prev) => ({ ...prev, modalLoading: true, apiError: null }));
    try {
      const slots = await scheduleService.getDaySlots(dateKey);
      setModal((prev) => ({ ...prev, daySlots: slots, modalLoading: false }));
    } catch {
      setModal((prev) => ({ ...prev, modalLoading: false, apiError: 'Failed to load slots.' }));
    }
  }, []);

  /** Opens the day modal and fetches authoritative slot data from the API */
  const openDayModal = useCallback(({ date, dateKey: dk }) => {
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    setModal({
      ...EMPTY_MODAL,
      open:        true,
      dateKey:     dk,
      dateLabel,
      modalLoading: true,
    });
    document.body.style.overflow = 'hidden';
    scheduleService.getDaySlots(dk)
      .then((slots) => setModal((prev) => ({ ...prev, daySlots: slots, modalLoading: false })))
      .catch(() => setModal((prev) => ({
        ...prev, modalLoading: false, apiError: 'Failed to load slots for this day.',
      })));
  }, []);

  const closeModal = useCallback(() => {
    setModal(EMPTY_MODAL);
    document.body.style.overflow = '';
  }, []);

  const selectSlot = (slot) => {
    setModal((prev) => ({
      ...prev,
      selected:    slot,
      apiError:    null,
      showAddForm: false,
    }));
  };

  const toggleCheck = (slotTime) => {
    setModal((prev) => {
      const already = prev.checkedSlots.includes(slotTime);
      return {
        ...prev,
        checkedSlots: already
          ? prev.checkedSlots.filter((s) => s !== slotTime)
          : [...prev.checkedSlots, slotTime],
      };
    });
  };

  const toggleCheckAll = () => {
    setModal((prev) => {
      const allTimes = prev.daySlots.map((s) => s.slotTime);
      const allChecked = allTimes.every((t) => prev.checkedSlots.includes(t));
      return { ...prev, checkedSlots: allChecked ? [] : allTimes };
    });
  };

  // ESC closes modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  /* ── block available slot ──────────────────────────────────── */

  const handleBlockSlot = async () => {
    const { selected, dateKey } = modal;
    if (!selected || selected.status !== 'AVAILABLE') return;

    // Extract local time from slot's slotTime (UTC ISO string)
    const slotDate = new Date(selected.slotTime);
    const localTime = slotDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/New_York',
    });

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    try {
      await scheduleService.createOverride({ date: dateKey, localTime, blocked: true });
      showToast('Slot blocked.');
      refreshAvailableSlots();
      refreshBlockedOverrides();
      await fetchDaySlots(dateKey);
      setModal((prev) => ({ ...prev, isLoading: false, selected: null }));
    } catch {
      setModal((prev) => ({ ...prev, isLoading: false, apiError: 'Failed to block slot. Try again.' }));
    }
  };

  /* ── unblock slot ──────────────────────────────────────────── */

  const handleUnblockSlot = async () => {
    const { selected, dateKey } = modal;
    if (!selected?.overrideId) return;

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    try {
      await scheduleService.deleteOverride(selected.overrideId);
      showToast('Slot unblocked.');
      refreshAvailableSlots();
      refreshBlockedOverrides();
      await fetchDaySlots(dateKey);
      setModal((prev) => ({ ...prev, isLoading: false, selected: null }));
    } catch {
      setModal((prev) => ({ ...prev, isLoading: false, apiError: 'Failed to unblock. Try again.' }));
    }
  };

  /* ── bulk block selected slots ────────────────────────────── */

  const handleBulkBlock = async () => {
    const { checkedSlots, dateKey, daySlots } = modal;
    const toBlock = checkedSlots.filter((st) =>
      daySlots.find((s) => s.slotTime === st && s.status === 'AVAILABLE')
    );
    if (!toBlock.length) return;

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    try {
      await Promise.all(toBlock.map((slotTime) => {
        const localTime = new Date(slotTime).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York',
        });
        return scheduleService.createOverride({ date: dateKey, localTime, blocked: true });
      }));
      showToast(`${toBlock.length} slot(s) blocked.`);
      refreshAvailableSlots();
      refreshBlockedOverrides();
      await fetchDaySlots(dateKey);
      setModal((prev) => ({ ...prev, isLoading: false, checkedSlots: [] }));
    } catch {
      setModal((prev) => ({ ...prev, isLoading: false, apiError: 'Failed to block slots.' }));
    }
  };

  /* ── add new slot ──────────────────────────────────────────── */

  const handleAddSlot = async () => {
    const { dateKey, newSlotTimes } = modal;
    if (!newSlotTimes.length) return;

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    try {
      await Promise.all(
        newSlotTimes.map((t) => scheduleService.createOverride({ date: dateKey, localTime: t, blocked: false }))
      );
      showToast(`${newSlotTimes.length} slot(s) added.`);
      refreshAvailableSlots();
      refreshBlockedOverrides();
      await fetchDaySlots(dateKey);
      setModal((prev) => ({ ...prev, isLoading: false, showAddForm: false, newSlotTimes: [] }));
    } catch {
      setModal((prev) => ({ ...prev, isLoading: false, apiError: 'Failed to add slots. Try again.' }));
    }
  };

  /* ── render ────────────────────────────────────────────────── */

  if (loading) return <LoadingSpinner />;

  const { selected } = modal;
  const selectedIsBooking  = selected && !!selected.bookingId;
  const selectedIsAvailable = selected?.status === 'AVAILABLE';
  const selectedIsBlocked   = selected?.status === 'BLOCKED';
  const selectedIsClosed    = selected?.status === BOOKING_STATUS.CANCELLED
                           || selected?.status === BOOKING_STATUS.REFUNDED;

  return (
    <main className="manage-schedule">
      <Link to="/admin/dashboard" style={{ fontSize: 14, color: 'var(--blue)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back</Link>
      <h1>Manage <span>Schedule</span></h1>

      {fetchError && <p className="error-message">{fetchError}</p>}

      {/* Session Type Filter */}
      <div className="schedule-filters">
        <label htmlFor="filterType">Session type:</label>
        <select id="filterType" value={filterTypeId} onChange={(e) => setFilterTypeId(e.target.value)}>
          <option value="">All sessions</option>
          {sessionTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name} ({st.durationMinutes} min)</option>
          ))}
        </select>
      </div>

      {/* Status Filter Checkboxes */}
      <div className="status-filters">
        <span className="status-filters-label">Show:</span>
        {[
          { key: BOOKING_STATUS.CONFIRMED, label: 'Confirmed'            },
          { key: 'available',              label: 'Available'             },
          { key: 'blocked',               label: 'Blocked'               },
          { key: BOOKING_STATUS.CANCELLED, label: 'Cancelled / Refunded'  },
        ].map(({ key, label }) => (
          <label key={key} className="status-filter-item">
            <input
              type="checkbox"
              checked={statusFilters[key]}
              onChange={() => setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
            <span className={`legend-dot ${toStatusClass(key)}`} />
            {label}
          </label>
        ))}
      </div>

      <CalendarView
        events={allEvents}
        onDayClick={openDayModal}
        mode="admin"
        loading={loadingSlots}
        defaultDate={defaultCalendarDate}
      />

      {/* ── Day Slots Modal ─────────────────────────────────────── */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card day-slots-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>

            <div className="day-modal-header">
              <h2>Edit Slots for {modal.dateLabel}</h2>
              <button
                className="btn-add-slot"
                onClick={() => setModal((prev) => ({
                  ...prev, showAddForm: !prev.showAddForm, selected: null,
                }))}
              >
                {modal.showAddForm ? 'Cancel' : '+ Add Slot'}
              </button>
            </div>

            {/* Add New Slot form */}
            {modal.showAddForm && (() => {
              const existingTimes = new Set(
                modal.daySlots.map((s) =>
                  new Date(s.slotTime).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York',
                  })
                )
              );
              const availableTimes = TIME_OPTIONS.filter((t) => !existingTimes.has(t));
              const allSelected = availableTimes.length > 0 && availableTimes.every((t) => modal.newSlotTimes.includes(t));
              return (
                <div className="day-slot-add-form">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 13, margin: 0, color: 'var(--gray-600)' }}>Select times to add:</p>
                    {availableTimes.length > 0 && (
                      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => setModal((prev) => ({
                            ...prev,
                            newSlotTimes: allSelected ? [] : availableTimes,
                          }))}
                        />
                        Select all
                      </label>
                    )}
                  </div>
                  {availableTimes.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>All time slots already exist for this day.</p>
                  ) : (
                    <div className="add-slot-time-grid">
                      {availableTimes.map((t) => {
                        const checked = modal.newSlotTimes.includes(t);
                        return (
                          <label key={t} className={`add-slot-time-option${checked ? ' selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setModal((prev) => ({
                                ...prev,
                                newSlotTimes: checked
                                  ? prev.newSlotTimes.filter((x) => x !== t)
                                  : [...prev.newSlotTimes, t],
                              }))}
                            />
                            {formatLocalTime(t)}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <div className="slot-edit-actions" style={{ marginTop: 12 }}>
                    <button
                      className="btn-save"
                      onClick={handleAddSlot}
                      disabled={modal.isLoading || modal.newSlotTimes.length === 0}
                    >
                      {modal.isLoading ? 'Adding…' : `Add ${modal.newSlotTimes.length || ''} Slot${modal.newSlotTimes.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Scrollable slot list */}
            <div className="day-slot-list">
              {modal.modalLoading && (
                <p className="day-slot-empty">Loading slots…</p>
              )}
              {!modal.modalLoading && modal.daySlots.length === 0 && (
                <p className="day-slot-empty">
                  No slots for this day.{' '}
                  <button
                    className="link-btn"
                    onClick={() => setModal((prev) => ({ ...prev, showAddForm: true }))}
                  >
                    Add one?
                  </button>
                </p>
              )}
              {!modal.modalLoading && modal.daySlots.length > 0 && (
                <div className="day-slot-select-all">
                  <label>
                    <input
                      type="checkbox"
                      checked={modal.daySlots.length > 0 && modal.daySlots.every((s) => modal.checkedSlots.includes(s.slotTime))}
                      onChange={toggleCheckAll}
                    />
                    Select all
                  </label>
                  {modal.checkedSlots.length > 0 && (
                    <button
                      className="btn-delete"
                      onClick={handleBulkBlock}
                      disabled={modal.isLoading}
                    >
                      {modal.isLoading ? 'Blocking…' : `Block Selected (${modal.checkedSlots.length})`}
                    </button>
                  )}
                </div>
              )}
              {modal.daySlots.map((slot, i) => {
                const sc         = toStatusClass(slot.status);
                const isSelected = selected?.slotTime === slot.slotTime;
                const isChecked  = modal.checkedSlots.includes(slot.slotTime);
                return (
                  <div
                    key={i}
                    className={`day-slot-row ${sc} ${isSelected ? 'day-slot-row-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(slot.slotTime)}
                      onClick={(e) => e.stopPropagation()}
                      className="day-slot-checkbox"
                    />
                    <button
                      className="day-slot-info"
                      onClick={() => selectSlot(slot)}
                    >
                      <span className="day-slot-time">{formatTime(slot.slotTime)}</span>
                      <span className={`status-badge ${sc}`}>{slot.status}</span>
                      {slot.clientName && (
                        <span className="day-slot-client">{slot.clientName}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Edit panel — shown when a slot is selected */}
            {selected && (
              <div className="day-slot-edit-form">
                <h3>
                  {formatTime(selected.slotTime)}
                  {' — '}
                  <span className={`status-badge ${toStatusClass(selected.status)}`}>
                    {selected.status}
                  </span>
                </h3>

                {/* ── AVAILABLE slot ── */}
                {selectedIsAvailable && (
                  <>
                    <p className="info-message">This slot is open and bookable by clients.</p>
                    <div className="slot-edit-actions">
                      <button
                        className="btn-delete"
                        onClick={handleBlockSlot}
                        disabled={modal.isLoading}
                      >
                        {modal.isLoading ? 'Blocking…' : 'Block Slot'}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setModal((prev) => ({ ...prev, selected: null }))}
                      >
                        Deselect
                      </button>
                    </div>
                  </>
                )}

                {/* ── BLOCKED slot ── */}
                {selectedIsBlocked && (
                  <>
                    <p className="info-message">This slot is blocked and hidden from clients.</p>
                    <div className="slot-edit-actions">
                      <button
                        className="btn-save"
                        onClick={handleUnblockSlot}
                        disabled={modal.isLoading}
                      >
                        {modal.isLoading ? 'Unblocking…' : 'Unblock Slot'}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setModal((prev) => ({ ...prev, selected: null }))}
                      >
                        Deselect
                      </button>
                    </div>
                  </>
                )}

                {/* ── RESERVED / CONFIRMED booking — read-only ── */}
                {selectedIsBooking && !selectedIsClosed && (
                  <>
                    <p className="info-message">Client: <strong>{selected.clientName || '—'}</strong></p>
                    {selected.notes && (
                      <p className="info-message" style={{ marginTop: 4 }}>Notes: {selected.notes}</p>
                    )}
                    <p className="info-message" style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.7 }}>
                      Manage this booking in the Bookings section.
                    </p>
                    <div className="slot-edit-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => setModal((prev) => ({ ...prev, selected: null }))}
                      >
                        Deselect
                      </button>
                    </div>
                  </>
                )}

                {/* ── CANCELLED / REFUNDED — read-only ── */}
                {selectedIsClosed && (
                  <>
                    {selected.clientName && (
                      <p className="info-message">Client: {selected.clientName}</p>
                    )}
                    {selected.notes && (
                      <p className="info-message" style={{ marginTop: 4 }}>Notes: {selected.notes}</p>
                    )}
                    <div className="slot-edit-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => setModal((prev) => ({ ...prev, selected: null }))}
                      >
                        Deselect
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {modal.apiError && !selected && (
              <p className="error-message" style={{ marginTop: 12 }}>{modal.apiError}</p>
            )}
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}
