/**
 * Booking Data Transfer Object
 */

class BookingDTO {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.listingId = data.listingId;
    this.listingType = data.listingType;
    this.status = data.status;
    this.amount = data.amount;
    this.bookingDate = data.bookingDate;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      listingId: this.listingId,
      listingType: this.listingType,
      status: this.status,
      amount: this.amount,
      bookingDate: this.bookingDate
    };
  }
}

module.exports = BookingDTO;

