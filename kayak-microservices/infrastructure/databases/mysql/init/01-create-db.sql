-- Create databases for microservices

CREATE DATABASE IF NOT EXISTS kayak_auth;
CREATE DATABASE IF NOT EXISTS kayak_users;
CREATE DATABASE IF NOT EXISTS kayak_listings;
CREATE DATABASE IF NOT EXISTS kayak_bookings;

-- Create users (optional - for production use different users per service)
-- CREATE USER IF NOT EXISTS 'kayak_user'@'%' IDENTIFIED BY 'kayak_password';
-- GRANT ALL PRIVILEGES ON kayak_*.* TO 'kayak_user'@'%';
-- FLUSH PRIVILEGES;

