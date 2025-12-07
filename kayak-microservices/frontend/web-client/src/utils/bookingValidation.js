/**
 * Flight Booking Validation Utilities
 * Validates booking data at each step of the booking process
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic international format)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate expiry date (MM/YY format)
 */
export const validateExpiryDate = (expiryDate) => {
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiryDate)) return false;
  
  const [month, year] = expiryDate.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Validate passport number (basic)
 */
export const validatePassportNumber = (passport) => {
  return passport.length >= 6 && /^[A-Z0-9]+$/i.test(passport);
};

/**
 * Validate date of birth (must be in the past and reasonable age)
 */
export const validateDateOfBirth = (dob) => {
  if (!dob) return false;
  
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  return birthDate < today && age >= 0 && age <= 120;
};

/**
 * Validate passenger details
 */
export const validatePassenger = (passenger, isInternational = false) => {
  const errors = {};
  
  if (!passenger.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!passenger.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!passenger.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(passenger.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!passenger.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(passenger.phone)) {
    errors.phone = 'Invalid phone number';
  }
  
  if (!passenger.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else if (!validateDateOfBirth(passenger.dateOfBirth)) {
    errors.dateOfBirth = 'Invalid date of birth';
  }
  
  // International flight requirements
  if (isInternational) {
    if (!passenger.passportNumber?.trim()) {
      errors.passportNumber = 'Passport number is required for international flights';
    } else if (!validatePassportNumber(passenger.passportNumber)) {
      errors.passportNumber = 'Invalid passport number';
    }
    
    if (!passenger.nationality?.trim()) {
      errors.nationality = 'Nationality is required for international flights';
    }
  }
  
  return errors;
};

/**
 * Validate all passengers
 */
export const validateAllPassengers = (passengers, isInternational = false) => {
  const errors = {};
  let hasErrors = false;
  
  passengers.forEach((passenger, index) => {
    const passengerErrors = validatePassenger(passenger, isInternational);
    if (Object.keys(passengerErrors).length > 0) {
      errors[`passenger_${passenger.id}`] = passengerErrors;
      hasErrors = true;
    }
  });
  
  return { errors, hasErrors };
};

/**
 * Validate contact information
 */
export const validateContactInfo = (contactInfo) => {
  const errors = {};
  
  if (!contactInfo.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(contactInfo.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!contactInfo.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(contactInfo.phone)) {
    errors.phone = 'Invalid phone number';
  }
  
  if (!contactInfo.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!contactInfo.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (!contactInfo.zipCode?.trim()) {
    errors.zipCode = 'Zip code is required';
  }
  
  if (!contactInfo.country?.trim()) {
    errors.country = 'Country is required';
  }
  
  return errors;
};

/**
 * Validate payment information
 */
export const validatePaymentInfo = (paymentInfo) => {
  const errors = {};
  
  // Skip validation for PayPal
  if (paymentInfo.method === 'paypal') {
    return errors;
  }
  
  if (!paymentInfo.cardNumber?.trim()) {
    errors.cardNumber = 'Card number is required';
  } else if (!validateCardNumber(paymentInfo.cardNumber)) {
    errors.cardNumber = 'Invalid card number';
  }
  
  if (!paymentInfo.cardName?.trim()) {
    errors.cardName = 'Cardholder name is required';
  }
  
  if (!paymentInfo.expiryDate?.trim()) {
    errors.expiryDate = 'Expiry date is required';
  } else if (!validateExpiryDate(paymentInfo.expiryDate)) {
    errors.expiryDate = 'Invalid or expired date';
  }
  
  if (!paymentInfo.cvv?.trim()) {
    errors.cvv = 'CVV is required';
  } else if (!validateCVV(paymentInfo.cvv)) {
    errors.cvv = 'Invalid CVV';
  }
  
  // Validate billing address if different from contact
  if (!paymentInfo.billingAddressSameAsContact && !paymentInfo.billingAddress) {
    errors.billingAddress = 'Billing address is required';
  }
  
  return errors;
};

/**
 * Validate booking step
 */
export const validateBookingStep = (step, bookingState) => {
  const errors = {};
  
  switch (step) {
    case 'selection':
      if (!bookingState.selectedOutboundFlight) {
        errors.flight = 'Please select an outbound flight';
      }
      if (!bookingState.selectedFare) {
        errors.fare = 'Please select a fare type';
      }
      break;
      
    case 'details':
      const passengerValidation = validateAllPassengers(
        bookingState.passengerDetails,
        isInternationalFlight(bookingState.selectedOutboundFlight)
      );
      if (passengerValidation.hasErrors) {
        Object.assign(errors, passengerValidation.errors);
      }
      break;
      
    case 'services':
      // Optional step - no required validation
      break;
      
    case 'payment':
      const contactErrors = validateContactInfo(bookingState.contactInfo);
      const paymentErrors = validatePaymentInfo(bookingState.paymentInfo);
      Object.assign(errors, contactErrors, paymentErrors);
      break;
      
    case 'review':
      // Final validation - check everything
      if (!bookingState.selectedOutboundFlight) {
        errors.flight = 'Flight selection is missing';
      }
      if (bookingState.passengerDetails.length === 0) {
        errors.passengers = 'No passengers added';
      }
      if (!bookingState.contactInfo.email) {
        errors.contact = 'Contact information is missing';
      }
      if (!bookingState.paymentInfo.method) {
        errors.payment = 'Payment method not selected';
      }
      break;
      
    default:
      break;
  }
  
  return errors;
};

/**
 * Check if flight is international
 */
export const isInternationalFlight = (flight) => {
  if (!flight) return false;
  
  // Get country codes from airport codes
  const originCode = flight.origin?.code || flight.departure_airport;
  const destCode = flight.destination?.code || flight.arrival_airport;
  
  // Simple check: if origin and destination are different countries
  // This is a simplified version - in production, you'd check against airport database
  const usAirports = ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'MCO', 'MIA', 'ATL', 'BOS', 'IAH', 'PHX', 'CLT'];
  
  const originIsUS = usAirports.includes(originCode);
  const destIsUS = usAirports.includes(destCode);
  
  return originIsUS !== destIsUS;
};

/**
 * Calculate booking completion percentage
 */
export const calculateBookingCompletion = (bookingState) => {
  let completed = 0;
  const total = 5; // Total steps (excluding confirmation)
  
  // Step 1: Flight selection
  if (bookingState.selectedOutboundFlight && bookingState.selectedFare) {
    completed++;
  }
  
  // Step 2: Passenger details
  if (bookingState.passengerDetails.every(p => p.firstName && p.lastName && p.email)) {
    completed++;
  }
  
  // Step 3: Additional services (optional, always counts as complete)
  completed++;
  
  // Step 4: Contact info
  if (bookingState.contactInfo.email && bookingState.contactInfo.phone) {
    completed++;
  }
  
  // Step 5: Payment info
  if (bookingState.paymentInfo.method && 
      (bookingState.paymentInfo.method === 'paypal' || bookingState.paymentInfo.cardNumber)) {
    completed++;
  }
  
  return Math.round((completed / total) * 100);
};

/**
 * Sanitize card number for display (show only last 4 digits)
 */
export const sanitizeCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\s/g, '');
  return `**** **** **** ${cleaned.slice(-4)}`;
};

/**
 * Format card number with spaces
 */
export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

/**
 * Format expiry date as MM/YY
 */
export const formatExpiryDate = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

/**
 * Validate entire booking before submission
 */
export const validateCompleteBooking = (bookingState) => {
  const errors = {};
  
  // Validate flight selection
  if (!bookingState.selectedOutboundFlight) {
    errors.flight = 'Flight selection is required';
  }
  
  // Validate passengers
  const passengerValidation = validateAllPassengers(
    bookingState.passengerDetails,
    isInternationalFlight(bookingState.selectedOutboundFlight)
  );
  if (passengerValidation.hasErrors) {
    errors.passengers = passengerValidation.errors;
  }
  
  // Validate contact
  const contactErrors = validateContactInfo(bookingState.contactInfo);
  if (Object.keys(contactErrors).length > 0) {
    errors.contact = contactErrors;
  }
  
  // Validate payment
  const paymentErrors = validatePaymentInfo(bookingState.paymentInfo);
  if (Object.keys(paymentErrors).length > 0) {
    errors.payment = paymentErrors;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateEmail,
  validatePhone,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validatePassportNumber,
  validateDateOfBirth,
  validatePassenger,
  validateAllPassengers,
  validateContactInfo,
  validatePaymentInfo,
  validateBookingStep,
  validateCompleteBooking,
  isInternationalFlight,
  calculateBookingCompletion,
  sanitizeCardNumber,
  formatCardNumber,
  formatExpiryDate
};
