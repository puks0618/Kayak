-- Insert test billing records into the database
USE kayak_billing;

INSERT INTO bills (user_id, booking_type, booking_id, total_amount, payment_method, transaction_status, invoice_details, invoice_number)
VALUES 
  ('user123', 'FLIGHT', 'FLT-2025-001', 450.00, 'CREDIT_CARD', 'PAID', 'Round trip to San Francisco', 'INV-2025-001'),
  ('user456', 'HOTEL', 'HTL-2025-002', 890.50, 'DEBIT_CARD', 'PAID', '3 nights at Grand Hotel', 'INV-2025-002'),
  ('user789', 'CAR', 'CAR-2025-003', 125.75, 'CREDIT_CARD', 'PENDING', 'Economy car rental for 2 days', 'INV-2025-003'),
  ('user123', 'FLIGHT', 'FLT-2025-004', 680.00, 'PAYPAL', 'PAID', 'Business class to New York', 'INV-2025-004'),
  ('user456', 'HOTEL', 'HTL-2025-005', 1200.00, 'CREDIT_CARD', 'OVERDUE', 'Luxury suite for 5 nights', 'INV-2025-005');

SELECT * FROM bills ORDER BY billing_id DESC;
