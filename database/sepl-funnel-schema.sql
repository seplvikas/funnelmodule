-- SEPL Funnel Portal Database Schema
-- Opportunity and Tender Lifecycle Management System

-- Funnel stages configuration table
CREATE TABLE IF NOT EXISTS sepl_funnel_stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default funnel stages
INSERT INTO sepl_funnel_stages (stage_name, stage_order) VALUES
('New / Identified', 1),
('Bid Submitted', 2),
('Under Evaluation', 3),
('Negotiation', 4),
('Won', 5),
('Lost', 6);

-- Main opportunities/tenders table
CREATE TABLE IF NOT EXISTS sepl_opportunities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  reference_number VARCHAR(100) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  customer VARCHAR(150),
  location VARCHAR(150),
  tender_name VARCHAR(255),
  tender_number VARCHAR(100),
  added_on DATETIME,
  requirement_type VARCHAR(100),
  eligible TINYINT(1) DEFAULT 0,
  emd DECIMAL(15,2) DEFAULT 0,
  project_domain VARCHAR(100),
  estimated_value DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  contract_period VARCHAR(100),
  submission_end_date DATETIME,
  created_date DATE NOT NULL,
  expected_closure_date DATE,
  assigned_owner_id INT,
  assigned_owner_name VARCHAR(255),
  assigned_owner_email VARCHAR(255),
  current_stage VARCHAR(100) DEFAULT 'New / Identified',
  status VARCHAR(50) DEFAULT 'Active',
  loss_reason TEXT,
  archived_reason TEXT,
  remarks TEXT,
  last_updated_on DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by_id INT,
  created_by_email VARCHAR(255),
  INDEX idx_stage (current_stage),
  INDEX idx_status (status),
  INDEX idx_owner (assigned_owner_id),
  INDEX idx_client (client_name),
  INDEX idx_closure_date (expected_closure_date)
);

-- Stage movement history / audit trail
CREATE TABLE IF NOT EXISTS sepl_stage_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  opportunity_id INT NOT NULL,
  from_stage VARCHAR(100),
  to_stage VARCHAR(100) NOT NULL,
  moved_by_id INT,
  moved_by_email VARCHAR(255),
  moved_by_name VARCHAR(255),
  remarks TEXT,
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES sepl_opportunities(id) ON DELETE CASCADE,
  INDEX idx_opportunity (opportunity_id),
  INDEX idx_moved_at (moved_at)
);

-- Add SEPL permissions to user_permissions table
-- Check if columns exist before adding
SET @schema_name = (SELECT DATABASE());

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'user_permissions' AND COLUMN_NAME = 'can_view_sepl');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE user_permissions ADD COLUMN can_view_sepl BOOLEAN DEFAULT FALSE', 
  'SELECT "Column can_view_sepl already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'user_permissions' AND COLUMN_NAME = 'can_create_sepl');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE user_permissions ADD COLUMN can_create_sepl BOOLEAN DEFAULT FALSE', 
  'SELECT "Column can_create_sepl already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'user_permissions' AND COLUMN_NAME = 'can_delete_sepl');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE user_permissions ADD COLUMN can_delete_sepl BOOLEAN DEFAULT FALSE', 
  'SELECT "Column can_delete_sepl already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Grant admin users full SEPL access
UPDATE user_permissions 
SET can_view_sepl = TRUE, can_create_sepl = TRUE, can_delete_sepl = TRUE
WHERE is_admin = TRUE;
