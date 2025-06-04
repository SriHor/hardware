-- Create database
CREATE DATABASE IF NOT EXISTS hardware_service_db;
USE hardware_service_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'engineer', 'telecaller', 'frontoffice') NOT NULL DEFAULT 'frontoffice',
    active TINYINT(1) NOT NULL DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(50) NOT NULL,
    created_by INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Service calls table
CREATE TABLE IF NOT EXISTS service_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    issue TEXT NOT NULL,
    description TEXT,
    status ENUM('pending', 'assigned', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    engineer_id INT,
    received_by INT,
    scheduled_date DATE,
    completed_at DATETIME,
    resolution TEXT,
    parts_used TEXT,
    billing_amount DECIMAL(10,2),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Service call notes
CREATE TABLE IF NOT EXISTS service_call_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_call_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (service_call_id) REFERENCES service_calls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2),
    supplier VARCHAR(100),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    transaction_type ENUM('in', 'out') NOT NULL,
    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    user_id INT NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Telecalling leads
CREATE TABLE IF NOT EXISTS telecalling_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    location VARCHAR(100),
    status ENUM('new', 'follow-up', 'converted', 'rejected') NOT NULL DEFAULT 'new',
    notes TEXT,
    created_by INT NOT NULL,
    follow_up_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Telecalling notes
CREATE TABLE IF NOT EXISTS telecalling_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES telecalling_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'View dashboard'),
('view_clients', 'View clients'),
('add_clients', 'Add new clients'),
('edit_clients', 'Edit existing clients'),
('delete_clients', 'Delete clients'),
('view_service_calls', 'View service calls'),
('add_service_calls', 'Add new service calls'),
('edit_service_calls', 'Edit existing service calls'),
('delete_service_calls', 'Delete service calls'),
('assign_service_calls', 'Assign service calls to engineers'),
('view_inventory', 'View inventory'),
('manage_inventory', 'Manage inventory (add, edit, delete)'),
('view_telecalling', 'View telecalling leads'),
('manage_telecalling', 'Manage telecalling leads'),
('view_reports', 'View reports'),
('manage_users', 'Manage users (add, edit, delete)'),
('manage_settings', 'Manage system settings');

-- Insert default admin user
INSERT INTO users (name, email, password, role, active, created_at) VALUES
('Admin User', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, NOW());

-- Insert sample clients
INSERT INTO clients (company_name, contact_person, email, phone, address, city, created_by, created_at) VALUES
('Tech Solutions Inc.', 'John Smith', 'john@techsolutions.com', '123-456-7890', '123 Tech Street', 'New York', 1, NOW()),
('Innovative Systems', 'Emma Johnson', 'emma@innovativesystems.com', '987-654-3210', '456 Innovation Avenue', 'San Francisco', 1, NOW()),
('Global Computers', 'Michael Brown', 'michael@globalcomputers.com', '555-123-4567', '789 Computer Lane', 'Chicago', 1, NOW()),
('DataServe Corporation', 'Sarah Wilson', 'sarah@dataserve.com', '444-789-1234', '321 Data Drive', 'Boston', 1, NOW()),
('Hardware Express', 'David Miller', 'david@hardwareexpress.com', '777-888-9999', '555 Hardware Boulevard', 'Seattle', 1, NOW());

-- Insert sample inventory items
INSERT INTO inventory (item_name, description, category, quantity, unit_price, supplier, created_at) VALUES
('Laptop RAM 8GB', 'DDR4 SODIMM Memory Module', 'Memory', 50, 45.99, 'MemoryTech', NOW()),
('SSD 500GB', 'Solid State Drive 2.5"', 'Storage', 30, 79.99, 'Storage Solutions', NOW()),
('Laptop Battery', 'Replacement Battery for Dell Latitude', 'Power', 25, 89.99, 'Power Components', NOW()),
('Network Card', 'Gigabit Ethernet Adapter', 'Networking', 40, 29.99, 'Network Pro', NOW()),
('CPU Cooling Fan', 'Replacement Cooling Fan for Desktop', 'Cooling', 35, 19.99, 'Cool Systems', NOW()),
('Power Supply 500W', 'ATX Power Supply Unit', 'Power', 20, 59.99, 'Power Solutions', NOW()),
('Keyboard', 'USB Wired Keyboard', 'Peripherals', 45, 24.99, 'Input Devices Inc.', NOW()),
('Mouse', 'Wireless Optical Mouse', 'Peripherals', 50, 19.99, 'Input Devices Inc.', NOW()),
('HDMI Cable', '6ft HDMI Cable', 'Cables', 100, 9.99, 'Cable Connect', NOW()),
('Thermal Paste', 'CPU Thermal Compound', 'Cooling', 60, 7.99, 'Cool Systems', NOW());

-- Insert sample service calls
INSERT INTO service_calls (client_id, issue, description, status, priority, engineer_id, received_by, scheduled_date, created_at) VALUES
(1, 'Network connectivity issues', 'Unable to connect to company network. All computers affected.', 'pending', 'high', NULL, 1, CURDATE(), NOW()),
(2, 'Laptop overheating', 'CEO laptop shutting down due to overheating.', 'assigned', 'medium', 1, 1, CURDATE() + INTERVAL 1 DAY, NOW()),
(3, 'Server maintenance', 'Scheduled server maintenance and updates.', 'in-progress', 'low', 1, 1, CURDATE() - INTERVAL 1 DAY, NOW()),
(4, 'Printer not working', 'Main office printer showing error codes.', 'pending', 'medium', NULL, 1, CURDATE() + INTERVAL 2 DAY, NOW()),
(5, 'Data recovery', 'Need to recover data from damaged hard drive.', 'assigned', 'urgent', 1, 1, CURDATE(), NOW());