import api from './api';
import { ENDPOINTS } from '../utils/constants';

const scheduleService = {
  /** GET /session-types */
  async getSessionTypes() {
    const response = await api.get(ENDPOINTS.SESSION_TYPES);
    return response.data;
  },

  /** GET /availability?sessionTypeId={id} — returns list of ISO strings */
  async getAvailableSlots(sessionTypeId) {
    const response = await api.get(ENDPOINTS.AVAILABILITY, {
      params: { sessionTypeId },
    });
    return response.data;
  },

  /**
   * GET /admin/schedule/day?date=YYYY-MM-DD
   * Returns DaySlotDto[] with status, overrideId, bookingId, etc.
   */
  async getDaySlots(dateKey) {
    const response = await api.get(ENDPOINTS.ADMIN_SCHEDULE_DAY, {
      params: { date: dateKey },
    });
    return response.data;
  },

  /**
   * POST /admin/schedule/overrides
   * Body: { date, localTime, blocked, notes }
   * blocked=true  → block a rule-generated slot
   * blocked=false → add a manual available slot
   */
  async createOverride({ date, localTime, blocked, notes }) {
    const response = await api.post(ENDPOINTS.ADMIN_SCHEDULE_OVERRIDES, {
      date, localTime, blocked, notes,
    });
    return response.data;
  },

  /**
   * GET /admin/schedule/overrides
   * Returns all ScheduleOverride records for calendar display.
   */
  async getOverrides() {
    const response = await api.get(ENDPOINTS.ADMIN_SCHEDULE_OVERRIDES);
    return response.data;
  },

  /**
   * DELETE /admin/schedule/overrides/{id}
   * Removes an override (unblocks or removes manual slot).
   */
  async deleteOverride(id) {
    await api.delete(ENDPOINTS.ADMIN_SCHEDULE_OVERRIDE(id));
  },

  async getAvailabilityRules() {
    const response = await api.get(ENDPOINTS.ADMIN_AVAILABILITY_RULES);
    return response.data;
  },

  async createAvailabilityRule(data) {
    const response = await api.post(ENDPOINTS.ADMIN_AVAILABILITY_RULES, data);
    return response.data;
  },

  async updateAvailabilityRule(id, data) {
    const response = await api.patch(ENDPOINTS.ADMIN_AVAILABILITY_RULE(id), data);
    return response.data;
  },

  async deleteAvailabilityRule(id) {
    await api.delete(ENDPOINTS.ADMIN_AVAILABILITY_RULE(id));
  },
};

export default scheduleService;
