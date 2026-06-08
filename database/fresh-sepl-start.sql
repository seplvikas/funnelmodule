-- ============================================
-- COMPLETELY FRESH START FOR SEPL FUNNEL
-- Drop everything and start clean
-- ============================================

USE easyreminder;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop ALL SEPL related tables
DROP TABLE IF EXISTS sepl_notifications;
DROP TABLE IF EXISTS sepl_stage_history;
DROP TABLE IF EXISTS sepl_opportunities;
DROP TABLE IF EXISTS sepl_customers;
DROP TABLE IF EXISTS sepl_products;
DROP TABLE IF EXISTS sepl_oems;
DROP TABLE IF EXISTS sepl_funnel_stages;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- MASTER TABLES (Optional - for dropdowns)
-- ============================================

CREATE TABLE sepl_customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  alias VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

CREATE TABLE sepl_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

CREATE TABLE sepl_oems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- ============================================
-- MAIN OPPORTUNITIES TABLE - EXACTLY MATCHING FORM
-- ============================================

CREATE TABLE sepl_opportunities (
  -- Primary
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- 1. Customer Details (Section 1 in form)
  customer_name VARCHAR(255),
  customer_alias VARCHAR(255),
  state VARCHAR(100),
  city VARCHAR(100),
  
  -- 2. Tender Details (Section 2 in form)
  tender_number VARCHAR(100),
  tender_name VARCHAR(500),
  requirement_type VARCHAR(100),
  
  -- 3. Dates (Section 3 in form)
  tender_publish_date DATE,
  pre_bid_date DATE,
  due_date DATE,
  submission_end_date DATE,
  
  -- 4. Financial Details (Section 4 in form)
  estimated_value DECIMAL(15,2) DEFAULT 0,
  contract_year INT DEFAULT 0,
  contract_month INT DEFAULT 0,
  ra DECIMAL(15,2) DEFAULT 0,
  emd DECIMAL(15,2) DEFAULT 0,
  emd_value VARCHAR(50),
  
  -- 5. Product & OEM (Section 5 in form)
  product_name VARCHAR(255),
  oem_name VARCHAR(255),
  quantity INT DEFAULT 0,
  
  -- 6. Officer in Charge (Section 6 in form)
  oic_name VARCHAR(255),
  
  -- 7. Case Owner (Section 7 in form)
  case_owner_email VARCHAR(255),
  case_owner_name VARCHAR(255),
  case_owners JSON,
  
  -- Additional fields
  eligible BOOLEAN DEFAULT TRUE,
  remarks TEXT,
  created_date DATE,
  
  -- Status & Stage (for funnel management)
  current_stage VARCHAR(100) DEFAULT 'New / Identified',
  status VARCHAR(50) DEFAULT 'Bucket',
  
  -- For Won/Lost/Archived
  loss_reason TEXT,
  archived_reason TEXT,
  
  -- Owner assignment (for moving to "On Going")
  assigned_owner_id INT,
  assigned_owner_name VARCHAR(255),
  assigned_owner_email VARCHAR(255),
  
  -- Audit
  created_by_id INT,
  created_by_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_status (status),
  INDEX idx_customer_name (customer_name),
  INDEX idx_tender_number (tender_number),
  INDEX idx_case_owner_email (case_owner_email),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- STAGE HISTORY TABLE
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
  FOREIGN KEY (opportunity_id) REFERENCES sepl_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (moved_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Sample master data
-- ============================================

INSERT INTO sepl_customers (name, alias) VALUES 
('Ministry of Defence', 'MOD'),
('Indian Railways', 'IR'),
('BSNL', 'Bharat Sanchar Nigam Limited'),
('All India Institute Of Speech And Hearing (aiish)', 'AIISH');

INSERT INTO sepl_products (name) VALUES 
('Cloud'),
('Firewall'),
('Load Balancer'),
('Network Switch'),
('Security Appliance');

INSERT INTO sepl_oems (name) VALUES 
('Microsoft'),
('Cisco'),
('Palo Alto'),
('Fortinet'),
('AWS');

SELECT 'Fresh SEPL tables created successfully!' AS Status;
