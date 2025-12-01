-- Seed Admin Users
-- Password for all users: "password123"
-- Hash generated with bcrypt (10 rounds): $2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i

USE kayak_auth;

-- Insert Admin Users
INSERT INTO users (id, ssn, first_name, last_name, address, city, state, zip_code, phone, email, password_hash, role, is_active) VALUES
('admin1', '123-45-6789', 'Admin', 'User', '123 Admin St', 'San Francisco', 'CA', '94103', '555-0001', 'admin@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'admin', true),
('admin2', '234-56-7890', 'Super', 'Admin', '456 Super Ave', 'San Francisco', 'CA', '94104', '555-0002', 'superadmin@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'admin', true),
('owner1', '345-67-8901', 'John', 'Owner', '789 Owner Blvd', 'San Jose', 'CA', '95110', '555-0003', 'owner@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner2', '456-78-9012', 'Jane', 'Host', '321 Host Dr', 'Los Angeles', 'CA', '90001', '555-0004', 'host@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner3', '567-89-0123', 'Bob', 'Smith', '654 Main St', 'New York', 'NY', '10001', '555-0005', 'bob@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner4', '678-90-1234', 'Alice', 'Johnson', '987 Park Ave', 'Chicago', 'IL', '60601', '555-0006', 'alice@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner5', '789-01-2345', 'Charlie', 'Brown', '147 Broadway', 'Seattle', 'WA', '98101', '555-0007', 'charlie@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('user1', '890-12-3456', 'David', 'Miller', '258 Oak St', 'Portland', 'OR', '97201', '555-0008', 'david@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user2', '901-23-4567', 'Emma', 'Davis', '369 Pine St', 'Austin', 'TX', '78701', '555-0009', 'emma@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user3', '012-34-5678', 'Frank', 'Wilson', '741 Elm St', 'Miami', 'FL', '33101', '555-0010', 'frank@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user4', '123-45-6780', 'Grace', 'Lee', '852 Maple Ave', 'Boston', 'MA', '02101', '555-0011', 'grace@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user5', '234-56-7891', 'Henry', 'Taylor', '963 Cedar Ln', 'Denver', 'CO', '80201', '555-0012', 'henry@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user6', '345-67-8902', 'Ivy', 'Anderson', '159 Birch Rd', 'Phoenix', 'AZ', '85001', '555-0013', 'ivy@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user7', '456-78-9013', 'Jack', 'Martinez', '357 Willow St', 'Atlanta', 'GA', '30301', '555-0014', 'jack@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user8', '567-89-0124', 'Kate', 'Garcia', '753 Spruce Dr', 'Dallas', 'TX', '75201', '555-0015', 'kate@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user9', '678-90-1235', 'Liam', 'Rodriguez', '951 Aspen Way', 'San Diego', 'CA', '92101', '555-0016', 'liam@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user10', '789-01-2346', 'Mia', 'Hernandez', '159 Poplar Ct', 'Las Vegas', 'NV', '89101', '555-0017', 'mia@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true);

-- Also insert into kayak_users for consistency
USE kayak_users;

INSERT INTO users (id, ssn, first_name, last_name, address, city, state, zip_code, phone, email, password_hash, role, is_active) VALUES
('admin1', '123-45-6789', 'Admin', 'User', '123 Admin St', 'San Francisco', 'CA', '94103', '555-0001', 'admin@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'admin', true),
('admin2', '234-56-7890', 'Super', 'Admin', '456 Super Ave', 'San Francisco', 'CA', '94104', '555-0002', 'superadmin@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'admin', true),
('owner1', '345-67-8901', 'John', 'Owner', '789 Owner Blvd', 'San Jose', 'CA', '95110', '555-0003', 'owner@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner2', '456-78-9012', 'Jane', 'Host', '321 Host Dr', 'Los Angeles', 'CA', '90001', '555-0004', 'host@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner3', '567-89-0123', 'Bob', 'Smith', '654 Main St', 'New York', 'NY', '10001', '555-0005', 'bob@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner4', '678-90-1234', 'Alice', 'Johnson', '987 Park Ave', 'Chicago', 'IL', '60601', '555-0006', 'alice@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('owner5', '789-01-2345', 'Charlie', 'Brown', '147 Broadway', 'Seattle', 'WA', '98101', '555-0007', 'charlie@kayak.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'owner', true),
('user1', '890-12-3456', 'David', 'Miller', '258 Oak St', 'Portland', 'OR', '97201', '555-0008', 'david@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user2', '901-23-4567', 'Emma', 'Davis', '369 Pine St', 'Austin', 'TX', '78701', '555-0009', 'emma@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user3', '012-34-5678', 'Frank', 'Wilson', '741 Elm St', 'Miami', 'FL', '33101', '555-0010', 'frank@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user4', '123-45-6780', 'Grace', 'Lee', '852 Maple Ave', 'Boston', 'MA', '02101', '555-0011', 'grace@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user5', '234-56-7891', 'Henry', 'Taylor', '963 Cedar Ln', 'Denver', 'CO', '80201', '555-0012', 'henry@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user6', '345-67-8902', 'Ivy', 'Anderson', '159 Birch Rd', 'Phoenix', 'AZ', '85001', '555-0013', 'ivy@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user7', '456-78-9013', 'Jack', 'Martinez', '357 Willow St', 'Atlanta', 'GA', '30301', '555-0014', 'jack@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user8', '567-89-0124', 'Kate', 'Garcia', '753 Spruce Dr', 'Dallas', 'TX', '75201', '555-0015', 'kate@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user9', '678-90-1235', 'Liam', 'Rodriguez', '951 Aspen Way', 'San Diego', 'CA', '92101', '555-0016', 'liam@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true),
('user10', '789-01-2346', 'Mia', 'Hernandez', '159 Poplar Ct', 'Las Vegas', 'NV', '89101', '555-0017', 'mia@example.com', '$2b$10$fk/TxK1vL5Gt9464M0GwTubYYWq/2NoCju4ESZ7G0jfS5TQu/in1i', 'traveller', true);
