export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[\d\s\-().+]{7,}$/.test(phone);
}

export function validateRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined && value !== '';
}

/**
 * Validates the booking form data.
 * Returns { isValid: boolean, errors: { field: message } }
 */
export function validateBookingForm(formData) {
  const errors = {};

  if (!validateRequired(formData.sessionTypeId)) {
    errors.sessionTypeId = 'Please select a session type';
  }
  if (!validateRequired(formData.startTime)) {
    errors.startTime = 'Please select a date and time';
  }
  if (!validateRequired(formData.clientName)) {
    errors.clientName = 'Name is required';
  }
  if (!validateRequired(formData.clientEmail)) {
    errors.clientEmail = 'Email is required';
  } else if (!validateEmail(formData.clientEmail)) {
    errors.clientEmail = 'Please enter a valid email';
  }
  if (!validateRequired(formData.clientPhone)) {
    errors.clientPhone = 'Phone number is required';
  } else if (!validatePhone(formData.clientPhone)) {
    errors.clientPhone = 'Please enter a valid phone number';
  }
  if (!formData.waiverAccepted) {
    errors.waiverAccepted = 'You must accept the waiver to proceed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
