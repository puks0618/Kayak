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
 * Validate phone number (10 digits)
 */
export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validate US zip code
 */
export const validateZipCode = (zip) => {
  // Accept: 12, 95123, 10293, 90086-1929
  const zipPattern = /^(\d{2}|\d{5})(-\d{4})?$/;
  return zipPattern.test(zip);
};

/**
 * Validate US state
 */
export const validateState = (state) => {
  if (!state) return false;
  const validStates = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };
  const upperState = state.toUpperCase();
  return validStates[upperState] !== undefined;
};

/**
 * Detect card type from card number
 */
export const detectCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Visa: starts with 4
  if (/^4/.test(cleaned)) return 'visa';
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(cleaned)) {
    return 'mastercard';
  }
  
  // American Express: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) return 'amex';
  
  // Discover: starts with 6011, 622126-622925, 644-649, or 65
  if (/^6011|^622(12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5])|^64[4-9]|^65/.test(cleaned)) {
    return 'discover';
  }
  
  return 'unknown';
};

/**
 * Validate credit/debit card number (Luhn algorithm)
 * Works for both credit and debit cards
 */
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Card number should be 13-19 digits
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  // Luhn algorithm (checksum validation)
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
 * Checks format and ensures card is not expired
 */
export const validateExpiryDate = (expiryDate) => {
  // Check format MM/YY
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiryDate)) return false;
  
  const [month, year] = expiryDate.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1;
  
  // Card is expired if year is in the past
  if (year < currentYear) return false;
  
  // If same year, check if month is current or future
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

/**
 * Validate CVV (3 digits for most cards, 4 for Amex)
 */
export const validateCVV = (cvv, cardType = null) => {
  const cleaned = cvv.replace(/\D/g, '');
  
  // American Express uses 4-digit CVV
  if (cardType === 'amex') {
    return /^\d{4}$/.test(cleaned);
  }
  
  // Most cards use 3-digit CVV
  return /^\d{3}$/.test(cleaned);
};

/**
 * Validate cardholder name
 */
export const validateCardholderName = (name) => {
  if (!name || name.trim().length < 3) return false;
  
  // Name should contain only letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name.trim());
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
    errors.phone = 'Phone must be exactly 10 digits';
  }
  
  // Address validation (same as cars/hotels)
  if (passenger.address !== undefined && !passenger.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (passenger.city !== undefined && !passenger.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (passenger.state !== undefined) {
    if (!passenger.state?.trim()) {
      errors.state = 'State is required';
    } else if (!validateState(passenger.state)) {
      errors.state = 'Invalid state code. Please use 2-letter US state code (e.g., CA, NY)';
    }
  }
  
  if (passenger.zipCode !== undefined) {
    if (!passenger.zipCode?.trim()) {
      errors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(passenger.zipCode)) {
      errors.zipCode = 'Invalid zip code. Valid formats: 12, 95123, or 12345-6789';
    }
  }
  
  if (passenger.dateOfBirth) {
    if (!validateDateOfBirth(passenger.dateOfBirth)) {
      errors.dateOfBirth = 'Invalid date of birth';
    }
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
    errors.phone = 'Phone must be exactly 10 digits';
  }
  
  if (!contactInfo.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!contactInfo.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (!contactInfo.zipCode?.trim()) {
    errors.zipCode = 'Zip code is required';
  } else if (!validateZipCode(contactInfo.zipCode)) {
    errors.zipCode = 'Invalid zip code. Valid formats: 12, 95123, or 12345-6789';
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
  validateCardholderName,
  detectCardType,
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
