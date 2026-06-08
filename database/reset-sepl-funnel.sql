-- ============================================
-- RESET SEPL FUNNEL DATABASE
-- This will drop and recreate the SEPL opportunities tables
-- ============================================

USE easyreminder;

-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS sepl_notifications;
DROP TABLE IF EXISTS sepl_stage_history;
DROP TABLE IF EXISTS sepl_opportunities;
DROP TABLE IF EXISTS sepl_customers;
DROP TABLE IF EXISTS sepl_products;
DROP TABLE IF EXISTS sepl_oems;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- SEPL Customers Table
-- ============================================
CREATE TABLE sepl_customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  alias VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- ============================================
-- SEPL Products Table
-- ============================================
CREATE TABLE sepl_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- ============================================
-- SEPL OEMs Table
-- ============================================
CREATE TABLE sepl_oems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- ============================================
-- SEPL Opportunities Table (Main Funnel Table)
-- ============================================
CREATE TABLE sepl_opportunities (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Customer Information
  customer_name VARCHAR(255),
  customer_alias VARCHAR(255),
  state VARCHAR(100),
  city VARCHAR(100),
  
  -- Tender Information
  tender_number VARCHAR(100),
  tender_name VARCHAR(500),
  requirement_type VARCHAR(100),
  
  -- Financial Information
  estimated_value DECIMAL(15,2) DEFAULT 0,
  contract_year INT,
  contract_month INT,
  ra DECIMAL(15,2),
  emd DECIMAL(15,2),
  emd_value VARCHAR(50),
  
  -- Dates
  tender_publish_date DATE,
  pre_bid_date DATE,
  due_date DATE,
  submission_end_date DATE,
  submission_date DATE,
  created_date DATE,
  
  -- Product & OEM
  product_name VARCHAR(255),
  oem_name VARCHAR(255),
  quantity INT,
  
  -- Officer In Charge
  oic_name VARCHAR(255),
  
  -- Ownership & Assignment
  assigned_owner_id INT,
  assigned_owner_name VARCHAR(255),
  assigned_owner_email VARCHAR(255),
  
  -- Status & Stage
  current_stage VARCHAR(100) DEFAULT 'New / Identified',
  status ENUM('Bucket-Active', 'Bucket-Cold', 'Ongoing-Active', 'Submitted', 'Won', 'Lost', 'Drop', 'Archived') DEFAULT 'Bucket-Active',
  
  -- Flags
  eligible BOOLEAN DEFAULT TRUE,
  
  -- Additional Information
  remarks TEXT,
  loss_reason TEXT,
  archived_reason TEXT,
  pricing_model VARCHAR(20),
  quotation_amount DECIMAL(15,2),
  gst_inclusive BOOLEAN,
  
  -- Audit Fields
  created_by_id INT,
  created_by_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_status (status),
  INDEX idx_current_stage (current_stage),
  INDEX idx_customer_name (customer_name),
  INDEX idx_tender_number (tender_number),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by_id (created_by_id),
  
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- SEPL Stage History Table
-- ============================================
CREATE TABLE sepl_stage_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  opportunity_id INT NOT NULL,
  from_stage VARCHAR(100),
  to_stage VARCHAR(100) NOT NULL,
  moved_by_id INT,
  moved_by_email VARCHAR(255),
  moved_by_name VARCHAR(255),
  remarks TEXT,
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_opportunity_id (opportunity_id),
  INDEX idx_moved_at (moved_at),
  
  FOREIGN KEY (opportunity_id) REFERENCES sepl_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (moved_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Insert sample data for testing
-- ============================================

-- Insert some sample customers
INSERT INTO sepl_customers (name, alias) VALUES 
('Ministry of Defence', 'MOD'),
('Indian Railways', 'IR'),
('BSNL', 'Bharat Sanchar Nigam Limited'),
('ONGC', 'Oil and Natural Gas Corporation');

-- Insert some sample products
INSERT INTO sepl_products (name) VALUES 
('Firewall'),
('Load Balancer'),
('Network Switch'),
('Security Appliance'),
('Cloud Services');

-- Insert some sample OEMs
INSERT INTO sepl_oems (name) VALUES 
('Cisco'),
('Palo Alto'),
('Fortinet'),
('Check Point'),
('F5 Networks');

-- ============================================
-- Verify tables created
-- ============================================
SELECT 'SEPL Tables Created Successfully' AS status;
SHOW TABLES LIKE 'sepl_%';
