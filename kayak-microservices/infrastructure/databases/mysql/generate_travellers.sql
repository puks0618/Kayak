-- Generate 7500 new travellers (2501 to 10000)
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS generate_travellers()
BEGIN
    DECLARE i INT DEFAULT 2501;
    DECLARE email_val VARCHAR(255);
    DECLARE ssn_val VARCHAR(11);
    DECLARE password_hash VARCHAR(255);
    
    -- Password hash for "Password123"
    SET password_hash = '$2b$10$Oo7tQt6N.ot5i3GBWfUYbOQ0iGfZqx6l/jTaNEAQfjrbecAj4SX4C';
    
    WHILE i <= 10000 DO
        SET email_val = CONCAT('traveller', LPAD(i, 5, '0'), '@test.com');
        SET ssn_val = CONCAT(
            LPAD(FLOOR(RAND() * 900) + 100, 3, '0'), '-',
            LPAD(FLOOR(RAND() * 90) + 10, 2, '0'), '-',
            LPAD(i, 4, '0')
        );
        
        INSERT IGNORE INTO kayak_users.users (
            id, ssn, first_name, last_name, email, password_hash, 
            address, city, state, zip_code, phone, role, is_active
        ) VALUES (
            UUID(),
            ssn_val,
            CONCAT('Traveller', i),
            CONCAT('User', i),
            email_val,
            password_hash,
            CONCAT(FLOOR(RAND() * 9000) + 1000, ' ', ELT(FLOOR(RAND() * 10) + 1, 'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Park', 'Lake', 'River', 'Hill'), ' St'),
            ELT(FLOOR(RAND() * 20) + 1, 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'),
            ELT(FLOOR(RAND() * 10) + 1, 'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'),
            LPAD(FLOOR(RAND() * 90000) + 10000, 5, '0'),
            CONCAT('(', LPAD(FLOOR(RAND() * 900) + 100, 3, '0'), ') ', LPAD(FLOOR(RAND() * 900) + 100, 3, '0'), '-', LPAD(FLOOR(RAND() * 9000) + 1000, 4, '0')),
            'traveller',
            1
        );
        
        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

CALL generate_travellers();
DROP PROCEDURE IF EXISTS generate_travellers;
