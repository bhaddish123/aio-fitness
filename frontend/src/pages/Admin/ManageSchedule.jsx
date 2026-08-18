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
    case 'NOT_SET':                return 'not-set';
    default:                       return 'available';
  }
};



const DAY_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_ORDER  = [1,2,3,4,5,6,0];
const fmtT = (t) => t ? t.slice(0, 5) : '';

/** 5:00 AM – 9:30 PM in 30-min steps (34 options) */
const generateFullDayCandidates = () => {
  const times = [];
  for (let h = 5; h <= 21; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }
  return times;
};

const fmtCandidateTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
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
  const [availabilityRules, setAvailabilityRules] = useState([]);
  const [weeklyPanelOpen, setWeeklyPanelOpen]     = useState(false);
  const [ruleAddForm, setRuleAddForm]             = useState({ dayOfWeek: 1, startTime: '07:00', endTime: '14:00', isActive: true });
  const [showAddRuleForm, setShowAddRuleForm]     = useState(false);
  const [editingRuleId, setEditingRuleId]         = useState(null);
  const [editRuleForm, setEditRuleForm]           = useState({});
  const [ruleError, setRuleError]                 = useState(null);
  const [savingRule, setSavingRule]               = useState(false);

  /* ── data fetching ─────────────────────────────────────────── */

  useEffect(() => {
    Promise.all([
      bookingService.getAllBookings(),
      scheduleService.getSessionTypes(),
      scheduleService.getAvailabilityRules(),
    ])
      .then(([b, st, rules]) => { setBookings(b); setSessionTypes(st); setAvailabilityRules(rules); })
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

  /* ── availability rule CRUD ─────────────────────────────────── */

  function findRuleConflict(rules, dayOfWeek, startTime, endTime, excludeId = null) {
    return rules.find(
      (r) =>
        r.isActive &&
        r.dayOfWeek === Number(dayOfWeek) &&
        r.id !== excludeId &&
        r.startTime.slice(0, 5) < endTime &&
        r.endTime.slice(0, 5) > startTime,
    );
  }

  function validateRuleForm(form, excludeId = null) {
    if (form.endTime <= form.startTime) return 'End time must be after start time.';
    if (form.isActive) {
      const conflict = findRuleConflict(availabilityRules, form.dayOfWeek, form.startTime, form.endTime, excludeId);
      if (conflict) return `Conflicts with: ${fmtT(conflict.startTime)}–${fmtT(conflict.endTime)}`;
    }
    return null;
  }

  async function handleAddRule(e) {
    e.preventDefault();
    const err = validateRuleForm(ruleAddForm);
    if (err) { setRuleError(err); return; }
    setSavingRule(true); setRuleError(null);
    try {
      const created = await scheduleService.createAvailabilityRule({
        dayOfWeek: Number(ruleAddForm.dayOfWeek),
        startTime: ruleAddForm.startTime,
        endTime: ruleAddForm.endTime,
        isActive: ruleAddForm.isActive,
      });
      setAvailabilityRules((prev) => [...prev, created]);
      setShowAddRuleForm(false);
      setRuleAddForm({ dayOfWeek: 1, startTime: '07:00', endTime: '14:00', isActive: true });
      showToast('Rule added.');
    } catch (err) {
      setRuleError(err?.response?.data?.error || 'Failed to add rule.');
    } finally {
      setSavingRule(false);
    }
  }

  async function handleEditRule(e) {
    e.preventDefault();
    const err = validateRuleForm(editRuleForm, editingRuleId);
    if (err) { setRuleError(err); return; }
    setSavingRule(true); setRuleError(null);
    try {
      const updated = await scheduleService.updateAvailabilityRule(editingRuleId, {
        dayOfWeek: Number(editRuleForm.dayOfWeek),
        startTime: editRuleForm.startTime,
        endTime: editRuleForm.endTime,
        isActive: editRuleForm.isActive,
      });
      setAvailabilityRules((prev) => prev.map((r) => (r.id === editingRuleId ? updated : r)));
      setEditingRuleId(null);
      showToast('Rule updated.');
    } catch (err) {
      setRuleError(err?.response?.data?.error || 'Failed to update rule.');
    } finally {
      setSavingRule(false);
    }
  }

  async function handleToggleRule(rule) {
    const newActive = !rule.isActive;
    if (newActive) {
      const conflict = findRuleConflict(availabilityRules, rule.dayOfWeek, fmtT(rule.startTime), fmtT(rule.endTime), rule.id);
      if (conflict) {
        showToast(`Cannot activate — conflicts with ${fmtT(conflict.startTime)}–${fmtT(conflict.endTime)}`, 'error');
        return;
      }
    }
    try {
      const result = await scheduleService.updateAvailabilityRule(rule.id, { isActive: newActive });
      setAvailabilityRules((prev) => prev.map((r) => (r.id === rule.id ? result : r)));
      showToast(result.isActive ? 'Rule activated.' : 'Rule deactivated.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to update rule.', 'error');
    }
  }

  async function handleDeleteRule(id) {
    if (!window.confirm('Delete this availability rule?')) return;
    try {
      await scheduleService.deleteAvailabilityRule(id);
      setAvailabilityRules((prev) => prev.filter((r) => r.id !== id));
      showToast('Rule deleted.');
    } catch {
      showToast('Failed to delete rule.', 'error');
    }
  }

  function startEditRule(rule) {
    setEditingRuleId(rule.id);
    setEditRuleForm({
      dayOfWeek: rule.dayOfWeek,
      startTime: fmtT(rule.startTime),
      endTime: fmtT(rule.endTime),
      isActive: rule.isActive,
    });
    setRuleError(null);
    setShowAddRuleForm(false);
  }

  /* ── derived data for CalendarView display ─────────────────── */

  const defaultCalendarDate = useMemo(() => new Date(), []);

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

  /** Full unified slot list for the day modal: existing API slots + NOT_SET candidates */
  const modalDaySlots = useMemo(() => {
    if (!modal.open || modal.modalLoading) return [];
    const existing = modal.daySlots.map((s) => ({
      ...s,
      localTime: new Date(s.slotTime).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York',
      }),
    }));
    const existingTimes = new Set(existing.map((s) => s.localTime));
    const notSet = generateFullDayCandidates()
      .filter((t) => !existingTimes.has(t))
      .map((t) => ({ localTime: t, status: 'NOT_SET' }));
    return [...existing, ...notSet].sort((a, b) => a.localTime.localeCompare(b.localTime));
  }, [modal.open, modal.modalLoading, modal.daySlots]);

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
    setModal((prev) => ({ ...prev, selected: slot, apiError: null }));
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
    const allTimes = modalDaySlots.map((s) => s.localTime);
    setModal((prev) => {
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

  /* ── shared slot-status setter (block or add) ─────────────── */

  const setSlotStatus = useCallback(async (dateKey, localTime, blocked) => {
    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    try {
      await scheduleService.createOverride({ date: dateKey, localTime, blocked });
      showToast(blocked ? 'Slot blocked.' : 'Slot added.');
      refreshAvailableSlots();
      refreshBlockedOverrides();
      await fetchDaySlots(dateKey);
      setModal((prev) => ({ ...prev, isLoading: false, selected: null }));
    } catch {
      setModal((prev) => ({
        ...prev,
        isLoading: false,
        apiError: `Failed to ${blocked ? 'block' : 'add'} slot. Try again.`,
      }));
    }
  }, [fetchDaySlots, refreshAvailableSlots, refreshBlockedOverrides]);

  const handleBlockSlot = () => {
    const { selected, dateKey } = modal;
    if (!selected || selected.status !== 'AVAILABLE') return;
    setSlotStatus(dateKey, selected.localTime, true);
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

  /* ── bulk block / add selected slots ─────────────────────── */

  const handleBulkBlock = async () => {
    const { checkedSlots, dateKey } = modal;
    const toBlock = checkedSlots.filter((lt) =>
      modalDaySlots.find((s) => s.localTime === lt && s.status === 'AVAILABLE')
    );
    if (!toBlock.length) return;

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    const results = await Promise.allSettled(
      toBlock.map((localTime) => scheduleService.createOverride({ date: dateKey, localTime, blocked: true }))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    refreshAvailableSlots();
    refreshBlockedOverrides();
    await fetchDaySlots(dateKey);
    if (failed === 0) {
      showToast(`${succeeded} slot${succeeded !== 1 ? 's' : ''} blocked.`);
      setModal((prev) => ({ ...prev, isLoading: false, checkedSlots: [] }));
    } else {
      setModal((prev) => ({
        ...prev,
        isLoading: false,
        checkedSlots: [],
        apiError: `${succeeded} blocked, ${failed} failed — refresh and try again.`,
      }));
    }
  };

  const handleBulkAdd = async () => {
    const { checkedSlots, dateKey } = modal;
    const toAdd = checkedSlots.filter((lt) =>
      modalDaySlots.find((s) => s.localTime === lt && (s.status === 'BLOCKED' || s.status === 'NOT_SET'))
    );
    if (!toAdd.length) return;

    setModal((prev) => ({ ...prev, isLoading: true, apiError: null }));
    const results = await Promise.allSettled(
      toAdd.map((localTime) => scheduleService.createOverride({ date: dateKey, localTime, blocked: false }))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    refreshAvailableSlots();
    refreshBlockedOverrides();
    await fetchDaySlots(dateKey);
    if (failed === 0) {
      showToast(`${succeeded} slot${succeeded !== 1 ? 's' : ''} added.`);
      setModal((prev) => ({ ...prev, isLoading: false, checkedSlots: [] }));
    } else {
      setModal((prev) => ({
        ...prev,
        isLoading: false,
        checkedSlots: [],
        apiError: `${succeeded} added, ${failed} failed — refresh and try again.`,
      }));
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

      {/* Default Weekly Hours panel */}
      <div className="weekly-hours-panel">
        <button
          className="weekly-hours-toggle"
          onClick={() => { setWeeklyPanelOpen((v) => !v); setShowAddRuleForm(false); setEditingRuleId(null); setRuleError(null); }}
        >
          Default Weekly Hours {weeklyPanelOpen ? '▴' : '▾'}
        </button>

        {weeklyPanelOpen && (
          <div className="weekly-hours-body">
            <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: '0 0 16px' }}>
              Recurring schedule shown to clients on the booking page. Changes take effect immediately.
            </p>

            {DAY_ORDER.map((day) => {
              const dayRules = availabilityRules.filter((r) => r.dayOfWeek === day);
              return (
                <div key={day} className="weekly-day-group">
                  <h4 className="weekly-day-label">{DAY_LABELS[day]}</h4>
                  {dayRules.length === 0 ? (
                    <p className="weekly-day-empty">No rules</p>
                  ) : (
                    dayRules.map((rule) => (
                      <div key={rule.id} className="weekly-rule-row">
                        {editingRuleId === rule.id ? (
                          <form className="weekly-rule-form" onSubmit={handleEditRule}>
                            <RuleFormInline form={editRuleForm} onChange={setEditRuleForm} />
                            {ruleError && <p className="error-message" style={{ margin: '6px 0 0', fontSize: 12 }}>{ruleError}</p>}
                            <div className="slot-edit-actions" style={{ marginTop: 8 }}>
                              <button className="btn-save" type="submit" disabled={savingRule}>{savingRule ? 'Saving…' : 'Save'}</button>
                              <button className="btn-cancel" type="button" onClick={() => { setEditingRuleId(null); setRuleError(null); }}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <span className="weekly-rule-time">{fmtT(rule.startTime)} – {fmtT(rule.endTime)}</span>
                            <span className={`status-badge ${rule.isActive ? 'confirmed' : 'cancelled'}`}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className="weekly-rule-actions">
                              <button className="btn-save" onClick={() => startEditRule(rule)}>Edit</button>
                              <button className={rule.isActive ? 'btn-cancel' : 'btn-save'} onClick={() => handleToggleRule(rule)}>
                                {rule.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="btn-delete" onClick={() => handleDeleteRule(rule.id)}>Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 20 }}>
              {showAddRuleForm ? (
                <form className="weekly-rule-form" onSubmit={handleAddRule}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>New Rule</h4>
                  <RuleFormInline form={ruleAddForm} onChange={setRuleAddForm} />
                  {ruleError && !editingRuleId && <p className="error-message" style={{ margin: '6px 0 0', fontSize: 12 }}>{ruleError}</p>}
                  <div className="slot-edit-actions" style={{ marginTop: 8 }}>
                    <button className="btn-save" type="submit" disabled={savingRule}>{savingRule ? 'Saving…' : 'Add Rule'}</button>
                    <button className="btn-cancel" type="button" onClick={() => { setShowAddRuleForm(false); setRuleError(null); }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button className="btn-add-slot" onClick={() => { setShowAddRuleForm(true); setEditingRuleId(null); setRuleError(null); }}>
                  + Add Rule
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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
            </div>

            {/* Scrollable slot list */}
            <div className="day-slot-list">
              {modal.modalLoading && (
                <p className="day-slot-empty">Loading slots…</p>
              )}
              {!modal.modalLoading && (() => {
                const blockableCount = modal.checkedSlots.filter((lt) =>
                  modalDaySlots.find((s) => s.localTime === lt && s.status === 'AVAILABLE')
                ).length;
                const addableCount = modal.checkedSlots.filter((lt) =>
                  modalDaySlots.find((s) => s.localTime === lt && (s.status === 'BLOCKED' || s.status === 'NOT_SET'))
                ).length;
                const anyChecked = modal.checkedSlots.length > 0;
                const allChecked = modalDaySlots.length > 0 && modalDaySlots.every((s) => modal.checkedSlots.includes(s.localTime));
                return (
                  <>
                    <div className="day-slot-select-all">
                      <label>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={toggleCheckAll}
                        />
                        Select all
                      </label>
                      {anyChecked && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {blockableCount > 0 && (
                            <button
                              className="btn-delete"
                              onClick={handleBulkBlock}
                              disabled={modal.isLoading}
                            >
                              {modal.isLoading ? 'Blocking…' : `Block Selected (${blockableCount})`}
                            </button>
                          )}
                          {addableCount > 0 && (
                            <button
                              className="btn-save"
                              onClick={handleBulkAdd}
                              disabled={modal.isLoading}
                            >
                              {modal.isLoading ? 'Adding…' : `Add Selected (${addableCount})`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {modalDaySlots.map((slot) => {
                      const sc         = toStatusClass(slot.status);
                      const isSelected = selected?.localTime === slot.localTime;
                      const isChecked  = modal.checkedSlots.includes(slot.localTime);
                      const isNotSet   = slot.status === 'NOT_SET';
                      return (
                        <div
                          key={slot.localTime}
                          className={`day-slot-row ${sc} ${isSelected ? 'day-slot-row-selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(slot.localTime)}
                            onClick={(e) => e.stopPropagation()}
                            className="day-slot-checkbox"
                          />
                          {isNotSet ? (
                            <div className="day-slot-info">
                              <span className="day-slot-time">{fmtCandidateTime(slot.localTime)}</span>
                              <span className={`status-badge ${sc}`}>—</span>
                            </div>
                          ) : (
                            <button
                              className="day-slot-info"
                              onClick={() => selectSlot(slot)}
                            >
                              <span className="day-slot-time">{fmtCandidateTime(slot.localTime)}</span>
                              <span className={`status-badge ${sc}`}>{slot.status}</span>
                              {slot.clientName && (
                                <span className="day-slot-client">{slot.clientName}</span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Edit panel — shown when a slot is selected */}
            {selected && (
              <div className="day-slot-edit-form">
                <h3>
                  {fmtCandidateTime(selected.localTime)}
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
                        Close
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
                        Close
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
                        Close
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
                        Close
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

function RuleFormInline({ form, onChange }) {
  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange((prev) => ({ ...prev, [key]: val }));
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
      <div className="form-group" style={{ minWidth: 120, margin: 0 }}>
        <label style={{ fontSize: 12, marginBottom: 4 }}>Day</label>
        <select value={form.dayOfWeek} onChange={set('dayOfWeek')}>
          {[1,2,3,4,5,6,0].map((d) => (
            <option key={d} value={d}>{DAY_LABELS[d]}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ minWidth: 100, margin: 0 }}>
        <label style={{ fontSize: 12, marginBottom: 4 }}>Start</label>
        <input type="time" value={form.startTime} onChange={set('startTime')} required />
      </div>
      <div className="form-group" style={{ minWidth: 100, margin: 0 }}>
        <label style={{ fontSize: 12, marginBottom: 4 }}>End</label>
        <input type="time" value={form.endTime} onChange={set('endTime')} required />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
        <input type="checkbox" id="ruleActiveInline" checked={form.isActive} onChange={set('isActive')} style={{ width: 'auto', margin: 0 }} />
        <label htmlFor="ruleActiveInline" style={{ fontSize: 12, margin: 0, cursor: 'pointer' }}>Active</label>
      </div>
    </div>
  );
}
