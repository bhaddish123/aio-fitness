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

// Client intake — Fitness Intake sub-step options
export const SEX_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'ONE_YEAR_OR_LESS', label: '1 year or less of training' },
  { value: 'TWO_TO_FOUR_YEARS', label: '2–4 years of training' },
  { value: 'FOUR_PLUS_YEARS', label: '4+ years of training' },
];

export const HELP_NEEDED_OPTIONS = [
  { value: 'WEIGHT_LOSS', label: 'Weight loss' },
  { value: 'MUSCLE_GAIN', label: 'Muscle gain' },
  { value: 'GENERAL_FITNESS', label: 'General fitness' },
  { value: 'BODYBUILDING', label: 'Bodybuilding' },
  { value: 'NUTRITION', label: 'Nutrition & food choices' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
  { value: 'INJURY_PAIN', label: 'Fixing pains/injuries' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'OTHER', label: 'Other' },
];
