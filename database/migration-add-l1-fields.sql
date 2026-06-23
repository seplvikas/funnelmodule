-- Add L1 Bid Details fields to sepl_opportunities table
-- These fields track the lowest (L1) competitor bid when an opportunity is marked as Lost

-- Check and add l1_cost column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'l1_cost');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN l1_cost DECIMAL(18,2) DEFAULT NULL COMMENT 'L1 (lowest) competitor bid cost'", 
  "SELECT 'Column l1_cost already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add l1_company_name column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'l1_company_name');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN l1_company_name VARCHAR(255) DEFAULT NULL COMMENT 'L1 (lowest) competitor company name'", 
  "SELECT 'Column l1_company_name already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add quotation_amount column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'quotation_amount');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN quotation_amount DECIMAL(18,2) DEFAULT NULL COMMENT 'Quoted amount for submitted bids'", 
  "SELECT 'Column quotation_amount already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add gst_inclusive column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'gst_inclusive');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN gst_inclusive TINYINT(1) DEFAULT 0 COMMENT 'Whether quotation is GST inclusive'", 
  "SELECT 'Column gst_inclusive already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add pricing_model column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'pricing_model');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN pricing_model VARCHAR(50) DEFAULT NULL COMMENT 'Pricing model - Monthly/Yearly/Lumpsum'", 
  "SELECT 'Column pricing_model already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add ra column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'ra');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN ra TINYINT(1) DEFAULT 0 COMMENT 'Resource Augmentation flag'", 
  "SELECT 'Column ra already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add submission_date column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'submission_date');

SET @query = IF(@col_exists = 0, 
  "ALTER TABLE sepl_opportunities ADD COLUMN submission_date DATE DEFAULT NULL COMMENT 'Date when bid was submitted'", 
  "SELECT 'Column submission_date already exists'");
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

