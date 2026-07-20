export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[\d\s\-().+]{7,}$/.test(phone);
}

export function validateRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== '';
}

/**
 * Validates sub-step 1 of "Your Details" — basic contact info.
 * Returns { isValid: boolean, errors: { field: message } }
 */
export function validateContactInfo(formData) {
  const errors = {};

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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates sub-step 2 of "Your Details" — the fitness intake questionnaire
 * plus the waiver acknowledgement.
 * Returns { isValid: boolean, errors: { field: message } }
 */
export function validateIntakeInfo(formData) {
  const errors = {};

  if (!validateRequired(formData.age)) {
    errors.age = 'Age is required';
  } else if (Number(formData.age) < 13 || Number(formData.age) > 110) {
    errors.age = 'Please enter a valid age';
  }
  if (!validateRequired(formData.sex)) {
    errors.sex = 'Please select an option';
  }
  if (!validateRequired(formData.gymSetup)) {
    errors.gymSetup = 'Please describe your gym set up';
  }
  if (!validateRequired(formData.weeklyCommitmentDays)) {
    errors.weeklyCommitmentDays = 'Please select how many days you can train';
  } else if (Number(formData.weeklyCommitmentDays) < 1 || Number(formData.weeklyCommitmentDays) > 7) {
    errors.weeklyCommitmentDays = 'Must be between 1 and 7 days';
  }
  if (!validateRequired(formData.experienceLevel)) {
    errors.experienceLevel = 'Please select your fitness level';
  }
  if (!validateRequired(formData.goals)) {
    errors.goals = 'Please share your goals';
  }
  if (!validateRequired(formData.helpNeeded)) {
    errors.helpNeeded = 'Please select at least one option';
  } else if (formData.helpNeeded.includes('OTHER') && !validateRequired(formData.helpNeededOther)) {
    errors.helpNeededOther = 'Please specify what "Other" refers to';
  }
  if (!formData.waiverAccepted) {
    errors.waiverAccepted = 'You must accept the waiver to proceed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the full booking form data (session, slot, contact info, and intake).
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

  Object.assign(
    errors,
    validateContactInfo(formData).errors,
    validateIntakeInfo(formData).errors,
  );

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
