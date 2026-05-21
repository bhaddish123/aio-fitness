export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Actual backend endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/admin/login',

  // Public
  SESSION_TYPES: '/session-types',
  AVAILABILITY: '/availability',

  // Booking flow
  RESERVE: '/bookings/reserve',
  CHECKOUT: (id) => `/bookings/${id}/checkout`,
  CANCEL: (token) => `/bookings/cancel/${token}`,

  // Content (public GET, admin PUT)
  CONTENT: '/content',
  ADMIN_CONTENT: (key) => `/admin/content/${key}`,

  // Admin (protected)
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_BOOKING: (id) => `/admin/bookings/${id}`,
  ADMIN_BOOKING_REFUND: (id) => `/admin/bookings/${id}/refund`,
  ADMIN_AVAILABILITY: '/admin/availability',
  ADMIN_SCHEDULE_DAY: '/admin/schedule/day',
  ADMIN_SCHEDULE_OVERRIDES: '/admin/schedule/overrides',
  ADMIN_SCHEDULE_OVERRIDE: (id) => `/admin/schedule/overrides/${id}`,
};

export const BOOKING_STATUS = {
  RESERVED: 'RESERVED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
};

export const FORM_FIELDS = {
  CLIENT_NAME: 'clientName',
  CLIENT_EMAIL: 'clientEmail',
  CLIENT_PHONE: 'clientPhone',
  INTAKE_NOTES: 'intakeNotes',
  WAIVER_ACCEPTED: 'waiverAccepted',
  SESSION_TYPE_ID: 'sessionTypeId',
  START_TIME: 'startTime',
};
