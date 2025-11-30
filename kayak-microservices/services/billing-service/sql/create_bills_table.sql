CREATE TABLE IF NOT EXISTS bills (
  billing_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id           VARCHAR(50) NOT NULL,
  booking_type      ENUM('FLIGHT','HOTEL','CAR') NOT NULL,
  booking_id        VARCHAR(50) NOT NULL,
  transaction_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount      DECIMAL(10,2) NOT NULL,
  payment_method    ENUM('CREDIT_CARD','DEBIT_CARD','PAYPAL','OTHER') NOT NULL,
  transaction_status ENUM('PENDING','PAID','OVERDUE','CANCELLED') NOT NULL,
  invoice_details   TEXT NULL,
  invoice_number    VARCHAR(50) NULL UNIQUE,
  INDEX idx_user_date (user_id, transaction_date),
  INDEX idx_booking (booking_type, booking_id),
  INDEX idx_status_date (transaction_status, transaction_date)
);

