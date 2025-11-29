/**
 * Fare Options Utility
 * Generates fare options (Basic, Economy) from base price
 */

/**
 * @typedef {Object} FareOption
 * @property {'BASIC' | 'ECONOMY'} code
 * @property {string} label
 * @property {number} price
 */

/**
 * @typedef {Object} DetailedFareOption
 * @property {'BASIC' | 'ECONOMY'} code
 * @property {string} label
 * @property {number} price
 * @property {boolean} refundable
 * @property {string[]} perks
 */

/**
 * Build basic fare options for search results page
 * @param {number} basePrice - The base price of the flight
 * @returns {FareOption[]} Array of fare options
 */
export function buildFareOptions(basePrice) {
  return [
    {
      code: 'BASIC',
      label: 'Basic',
      price: Math.round(basePrice)
    },
    {
      code: 'ECONOMY',
      label: 'Economy',
      price: Math.round(basePrice * 1.6)
    }
  ];
}

/**
 * Build detailed fare options for fare selection page
 * @param {number} basePrice - The base price of the flight
 * @returns {DetailedFareOption[]} Array of detailed fare options
 */
export function buildDetailedFareOptions(basePrice) {
  const basicPrice = Math.round(basePrice);
  const economyPrice = Math.round(basePrice * 1.6);

  return [
    {
      code: 'BASIC',
      label: 'Basic',
      price: basicPrice,
      refundable: false,
      perks: [
        'Carry-on bag for a fee',
        'Checked bag for a fee',
        'Seat selection for a fee',
        'Extra legroom for a fee',
        'Ticket changes for a fee',
        'No refunds'
      ]
    },
    {
      code: 'ECONOMY',
      label: 'Economy',
      price: economyPrice,
      refundable: true,
      perks: [
        '1 carry-on bag',
        '1st checked bag: $146',
        'Free seat selection',
        'Legroom info unavailable',
        'Free ticket changes',
        'Refundable'
      ]
    }
  ];
}

/**
 * Get amenity icons for a fare
 * @param {string} fareCode - 'BASIC' or 'ECONOMY'
 * @returns {Array<{icon: string, included: boolean, label: string}>}
 */
export function getFareAmenities(fareCode) {
  if (fareCode === 'BASIC') {
    return [
      { icon: '💼', included: false, label: 'Carry-on: fee' },
      { icon: '🧳', included: false, label: 'Checked bag: fee' },
      { icon: '🪑', included: false, label: 'Seat selection: fee' }
    ];
  }
  
  // ECONOMY
  return [
    { icon: '💼', included: true, label: 'Carry-on included' },
    { icon: '🧳', included: false, label: 'Checked bag: $146' },
    { icon: '🪑', included: true, label: 'Free seat selection' }
  ];
}

