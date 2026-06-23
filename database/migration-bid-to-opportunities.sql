-- Migration Script: Bid Table to SEPL Opportunities
-- Purpose: Migrate all existing data from funnel.bid table to sepl_opportunities table
-- Date: 2026-01-06
-- Author: SEPL System Migration

-- Step 1: Ensure all required columns exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'loss_reason');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN loss_reason TEXT AFTER status', 
  'SELECT "Column loss_reason already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'archived_reason');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN archived_reason TEXT AFTER loss_reason', 
  'SELECT "Column archived_reason already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add additional columns that exist in bid table but not in sepl_opportunities
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'customer_name');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN customer_name VARCHAR(255) AFTER client_name', 
  'SELECT "Column customer_name already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'customer_alias');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN customer_alias VARCHAR(255) AFTER customer_name', 
  'SELECT "Column customer_alias already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'state');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN state VARCHAR(50) AFTER location', 
  'SELECT "Column state already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'city');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN city VARCHAR(50) AFTER state', 
  'SELECT "Column city already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'oic_name');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN oic_name VARCHAR(255)', 
  'SELECT "Column oic_name already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'contract_year');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN contract_year TINYINT(4) DEFAULT 0', 
  'SELECT "Column contract_year already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'contract_month');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN contract_month TINYINT(4) DEFAULT 0', 
  'SELECT "Column contract_month already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'emd_value');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN emd_value VARCHAR(50)', 
  'SELECT "Column emd_value already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'ra');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN ra TINYINT(4) DEFAULT 0', 
  'SELECT "Column ra already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'pre_bid_date');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN pre_bid_date DATE', 
  'SELECT "Column pre_bid_date already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'due_date');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN due_date DATE', 
  'SELECT "Column due_date already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'submission_end_date');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN submission_end_date DATE', 
  'SELECT "Column submission_end_date already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'lost_bid_won_by');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN lost_bid_won_by VARCHAR(255)', 
  'SELECT "Column lost_bid_won_by already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'lost_bid_winning_value');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN lost_bid_winning_value VARCHAR(25)', 
  'SELECT "Column lost_bid_winning_value already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Clear existing data
DELETE FROM sepl_opportunities;
ALTER TABLE sepl_opportunities AUTO_INCREMENT = 1;

-- Step 3: Migrate data from funnel.bid table with proper status mapping
-- Status mapping: 1,2=Ongoing-Active, 3=Submitted, 4=Won, 5=Lost, 6=Archived
INSERT INTO sepl_opportunities (
  title,
  reference_number,
  client_name,
  customer_name,
  customer_alias,
  location,
  state,
  city,
  tender_name,
  tender_number,
  requirement_type,
  eligible,
  emd,
  estimated_value,
  contract_year,
  contract_month,
  remarks,
  emd_value,
  ra,
  pre_bid_date,
  due_date,
  submission_end_date,
  oic_name,
  status,
  loss_reason,
  archived_reason,
  lost_bid_won_by,
  lost_bid_winning_value,
  current_stage,
  created_date,
  created_at,
  updated_at
)
SELECT 
  b.tender_name as title,
  CONCAT('BID-', LPAD(b.id, 6, '0')) as reference_number,
  COALESCE(c.name, 'Unknown Customer') as client_name,
  COALESCE(c.name, 'Unknown Customer') as customer_name,
  b.customer_alias,
  b.location,
  b.state,
  b.city,
  b.tender_name,
  b.tender_no as tender_number,
  CASE 
    WHEN b.requirement_type = 1 THEN 'Hardware'
    WHEN b.requirement_type = 2 THEN 'License'
    WHEN b.requirement_type = 3 THEN 'Cloud'
    WHEN b.requirement_type = 4 THEN 'Software'
    WHEN b.requirement_type = 5 THEN 'Turnkey'
    WHEN b.requirement_type = 6 THEN 'Manpower/Consulting'
    WHEN b.requirement_type = 7 THEN 'Hardware with Licenses'
    ELSE 'Other'
  END as requirement_type,
  b.eligible,
  b.emd,
  b.tender_value as estimated_value,
  b.contract_year,
  b.contract_month,
  b.remarks,
  b.emd_value,
  b.ra,
  b.pre_bid_date,
  b.due_date,
  b.submission_date as submission_end_date,
  b.oic_name,
  CASE 
    WHEN b.status IN (1, 2) THEN 'Ongoing-Active'
    WHEN b.status = 3 THEN 'Submitted'
    WHEN b.status = 4 THEN 'Won'
    WHEN b.status = 5 THEN 'Lost'
    WHEN b.status = 6 THEN 'Archived'
    ELSE 'Ongoing-Active'
  END as status,
  CASE 
    WHEN b.status = 5 THEN CONCAT(
      IF(b.lost_bid_won_by != '', CONCAT('Lost to: ', b.lost_bid_won_by, '. '), ''),
      IF(b.lost_bid_winning_value != '' AND b.lost_bid_winning_value != 'NA', CONCAT('Winning value: ', b.lost_bid_winning_value, '. '), ''),
      IF(b.remarks != '', b.remarks, '')
    )
    ELSE NULL
  END as loss_reason,
  CASE 
    WHEN b.status = 6 THEN b.archived_reason
    ELSE NULL
  END as archived_reason,
  b.lost_bid_won_by,
  b.lost_bid_winning_value,
  CASE 
    WHEN b.status IN (1, 2) THEN 'New / Identified'
    WHEN b.status = 3 THEN 'Bid Submitted'
    WHEN b.status = 4 THEN 'Won'
    WHEN b.status = 5 THEN 'Lost'
    WHEN b.status = 6 THEN 'Lost'
    ELSE 'New / Identified'
  END as current_stage,
  DATE(b.created_on) as created_date,
  b.created_on as created_at,
  COALESCE(b.updated_on, b.created_on) as updated_at
FROM funnel.bid b
LEFT JOIN funnel.customer c ON b.customer = c.id
ORDER BY b.id;

-- Step 4: Verify migration
SELECT 
  'Migration Summary' as summary,
  COUNT(*) as total_records,
  SUM(CASE WHEN status = 'OnGoing' THEN 1 ELSE 0 END) as ongoing_count,
  SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
  SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) as won_count,
  SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) as lost_count,
  SUM(CASE WHEN status = 'Archived' THEN 1 ELSE 0 END) as archived_count
FROM sepl_opportunities;

-- Detailed status breakdown
SELECT 
  status,
  COUNT(*) as count,
  CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sepl_opportunities), 2), '%') as percentage
FROM sepl_opportunities
GROUP BY status
ORDER BY 
  FIELD(status, 'OnGoing', 'Submitted', 'Won', 'Lost', 'Archived');

-- Show sample records per status
SELECT 
  'OnGoing Opportunities' as category,
  reference_number,
  title,
  client_name,
  estimated_value,
  created_date
FROM sepl_opportunities
WHERE status = 'OnGoing'
LIMIT 5;

SELECT 
  'Submitted Opportunities' as category,
  reference_number,
  title,
  client_name,
  estimated_value,
  created_date
FROM sepl_opportunities
WHERE status = 'Submitted'
LIMIT 5;

SELECT 
  'Won Opportunities' as category,
  reference_number,
  title,
  client_name,
  estimated_value,
  created_date
FROM sepl_opportunities
WHERE status = 'Won'
LIMIT 5;

SELECT 
  'Lost Opportunities' as category,
  reference_number,
  title,
  client_name,
  loss_reason,
  created_date
FROM sepl_opportunities
WHERE status = 'Lost'
LIMIT 5;

SELECT 
  'Archived Opportunities' as category,
  reference_number,
  title,
  client_name,
  archived_reason,
  created_date
FROM sepl_opportunities
WHERE status = 'Archived'
LIMIT 5;

SELECT CONCAT(
  'Migration Complete! Total records migrated: ', 
  (SELECT COUNT(*) FROM sepl_opportunities),
  ' from funnel.bid table'
) as final_status;
