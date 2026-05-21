import { useState, useMemo } from 'react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/**
 * Reusable calendar grid component.
 *
 * Props:
 *   events        - [{ id, startTime (ISO), label, status, data }]
 *   onSlotClick   - (event) => void
 *   selectedSlot  - ISO string of currently selected slot
 *   mode          - 'public' | 'admin'
 *   loading       - bool
 *   defaultDate   - optional Date to initialize the calendar month
 */
export default function CalendarView({
  events = [],
  onSlotClick,
  onDayClick,
  selectedSlot,
  mode = 'public',
  loading = false,
  defaultDate,
}) {
  const [currentDate, setCurrentDate] = useState(defaultDate || new Date());
  const [selectedDay, setSelectedDay] = useState(null); // Date object for day modal

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group events by local date key (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = new Date(ev.startTime);
      const key = localDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // Build the 6-week grid starting from the Monday before the 1st
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    const dow = (firstDay.getDay() + 6) % 7; // 0=Mon
    startDate.setDate(startDate.getDate() - dow);

    const days = [];
    const cur  = new Date(startDate);
    while (cur <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
      if (days.length > 42) break;
    }
    return days;
  }, [year, month]);

  const todayMidnight = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

  const formatDayHeading = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

  // When a date cell is clicked
  const handleDayClick = (day, dayEvents, isPast) => {
    if (mode === 'public' && isPast) return; // no-op on past days in public mode
    if (onDayClick) {
      onDayClick({ date: day, events: dayEvents, dateKey: localDateKey(day) });
      return;
    }
    setSelectedDay({ date: day, events: dayEvents });
  };

  // Navigate to a different month (e.g. when clicking a prev/next-month date cell)
  const navigateToMonth = (date) => {
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDay(null);
  };

  const closeDayModal = () => setSelectedDay(null);

  return (
    <>
      <div className="calendar-view">
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-nav">
            <button
              className="cal-nav-btn"
              onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
            >
              ‹
            </button>
            <span className="calendar-title">{MONTH_NAMES[month]} {year}</span>
            <button
              className="cal-nav-btn"
              onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
            >
              ›
            </button>
          </div>
          <button
            className="cal-today-btn"
            onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }}
          >
            Today
          </button>
        </div>

        {loading && <p className="calendar-loading">Loading slots…</p>}

        {/* Grid */}
        <div className="calendar-grid">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}

          {calendarDays.map((day, i) => {
            const key        = localDateKey(day);
            const dayEvents  = (eventsByDate[key] || []).sort(
              (a, b) => new Date(a.startTime) - new Date(b.startTime)
            );
            const isThisMonth = day.getMonth() === month;
            const dayMidnight = new Date(day);
            dayMidnight.setHours(0, 0, 0, 0);
            const isPast      = dayMidnight < todayMidnight;
            const isToday     = dayMidnight.getTime() === todayMidnight.getTime();
            const isSelected  = selectedDay && localDateKey(selectedDay.date) === key;

            return (
              <div
                key={i}
                className={[
                  'calendar-day',
                  isThisMonth ? '' : 'other-month',
                  isPast      ? 'past-day'      : '',
                  isToday     ? 'today'         : '',
                  isSelected  ? 'day-selected'  : '',
                  mode === 'admin' || (!isPast) ? 'day-clickable' : '',
                ].join(' ')}
                onClick={() => {
                  if (!isThisMonth) {
                    navigateToMonth(day);
                  } else {
                    handleDayClick(day, dayEvents, isPast);
                  }
                }}
              >
                <span className="day-number">{day.getDate()}</span>

                {mode === 'admin' ? (
                  /* Admin: compact count badges per status */
                  <div className="day-count-badges">
                    {(() => {
                      const counts = {};
                      dayEvents.forEach((ev) => {
                        const s = (ev.status || 'available').toLowerCase();
                        counts[s] = (counts[s] || 0) + 1;
                      });
                      const ORDER = ['confirmed', 'reserved', 'available', 'blocked', 'cancelled', 'refunded'];
                      return ORDER.filter((s) => counts[s]).map((s) => (
                        <span key={s} className={`count-badge ${s}`} title={`${counts[s]} ${s}`}>
                          {counts[s]}
                        </span>
                      ));
                    })()}
                  </div>
                ) : (
                  /* Public: individual clickable slot pills */
                  <div className="day-slots">
                    {dayEvents.slice(0, 4).map((ev, j) => {
                      const sc        = (ev.status || 'available').toLowerCase();
                      const isSlotSel = selectedSlot === ev.startTime;
                      return (
                        <button
                          key={j}
                          className={`slot-pill ${sc} ${isSlotSel ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSlotClick && onSlotClick(ev);
                          }}
                          disabled={isPast}
                          title={ev.label || formatTime(ev.startTime)}
                        >
                          {formatTime(ev.startTime)}
                          {ev.label && <span className="slot-label">{ev.label}</span>}
                        </button>
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <span className="more-slots">+{dayEvents.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={closeDayModal}>
          <div className="modal-card day-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDayModal}>✕</button>
            <h2>{formatDayHeading(selectedDay.date)}</h2>

            {selectedDay.events.length === 0 ? (
              <p className="day-modal-empty">No sessions scheduled for this day.</p>
            ) : (
              <div className="day-modal-slots">
                {selectedDay.events.map((ev, i) => {
                  const sc = (ev.status || 'available').toLowerCase();
                  return (
                    <div key={i} className={`day-modal-slot ${sc}`}>
                      <div className="day-modal-slot-time">{formatTime(ev.startTime)}</div>
                      <div className="day-modal-slot-info">
                        {ev.label && <span className="day-modal-client">{ev.label}</span>}
                        <span className={`status-badge ${sc}`}>{ev.status || 'Available'}</span>
                      </div>
                      {ev.data?.sessionType && (
                        <div className="day-modal-session">{ev.data.sessionType.name}</div>
                      )}
                      {mode === 'admin' && ev.data && (
                        <button
                          className="day-modal-detail-btn"
                          onClick={() => { onSlotClick && onSlotClick(ev); closeDayModal(); }}
                        >
                          View Details →
                        </button>
                      )}
                      {mode === 'public' && sc === 'available' && (
                        <button
                          className="day-modal-detail-btn"
                          onClick={() => { onSlotClick && onSlotClick(ev); closeDayModal(); }}
                        >
                          Select this slot →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
