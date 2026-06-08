-- SEPL Opportunities Migration - Status Fix
-- Purpose: Fix status field to properly separate Lost, Archived, Won, OnGoing, and Submitted opportunities
-- Date: 2026-01-06

-- Step 1: Ensure all required columns exist in sepl_opportunities table
-- Add loss_reason column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'loss_reason');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN loss_reason TEXT AFTER status', 
  'SELECT "Column loss_reason already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add archived_reason column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sepl_opportunities' AND COLUMN_NAME = 'archived_reason');

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE sepl_opportunities ADD COLUMN archived_reason TEXT AFTER loss_reason', 
  'SELECT "Column archived_reason already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Clear existing data to start fresh with proper status values
DELETE FROM sepl_opportunities;

-- Step 3: Reset AUTO_INCREMENT to start from 1
ALTER TABLE sepl_opportunities AUTO_INCREMENT = 1;

-- Step 4: Insert sample data with proper status separation
-- Sample OnGoing Opportunities (5 records)
INSERT INTO sepl_opportunities 
(title, reference_number, client_name, customer, location, tender_name, tender_number, requirement_type, 
 eligible, emd, estimated_value, current_stage, status, created_date, created_at)
VALUES
('Oracle Cloud Migration Project', 'OCP-2024-001', 'TechCorp India', 'TechCorp', 'Bangalore', 
 'Oracle Cloud Infrastructure Setup', 'GEM/2024/B/5141486', 'Cloud', 1, 50000.00, 2500000.00, 
 'New / Identified', 'OnGoing', CURDATE(), NOW()),

('SAP ERP Implementation', 'SAP-2024-002', 'Finance Solutions Ltd', 'FS Ltd', 'Mumbai', 
 'Enterprise Resource Planning System', 'GEM/2024/B/5141487', 'Software', 1, 75000.00, 3500000.00, 
 'Bid Submitted', 'OnGoing', CURDATE(), NOW()),

('Windows Server Licensing', 'WIN-2024-003', 'DataCenters India', 'DataCenters', 'Delhi', 
 'Server Operating System Licenses', 'GEM/2024/B/5141488', 'License', 1, 25000.00, 1200000.00, 
 'Under Evaluation', 'OnGoing', CURDATE(), NOW()),

('Cybersecurity Assessment', 'CYBER-2024-004', 'SecureBank Corp', 'SecureBank', 'Hyderabad', 
 'Information Security & Compliance', 'GEM/2024/B/5141489', 'Manpower/Consulting', 1, 35000.00, 1800000.00, 
 'Negotiation', 'OnGoing', CURDATE(), NOW()),

('Network Hardware Upgrade', 'NET-2024-005', 'TelecomPro Inc', 'TelecomPro', 'Pune', 
 'Networking Equipment & Installation', 'GEM/2024/B/5141490', 'Hardware', 1, 60000.00, 2800000.00, 
 'New / Identified', 'OnGoing', CURDATE(), NOW());

-- Sample Submitted Opportunities (3 records)
INSERT INTO sepl_opportunities 
(title, reference_number, client_name, customer, location, tender_name, tender_number, requirement_type, 
 eligible, emd, estimated_value, current_stage, status, created_date, created_at)
VALUES
('AI/ML Platform Development', 'AI-2024-006', 'InnovateLabs', 'InnovateLabs', 'Bangalore', 
 'Artificial Intelligence Solution', 'GEM/2024/B/5141491', 'Software', 1, 80000.00, 4500000.00, 
 'Bid Submitted', 'Submitted', CURDATE(), NOW()),

('Cloud Storage Infrastructure', 'CLOUD-2024-007', 'StoragePlus', 'StoragePlus', 'Chennai', 
 'Enterprise Cloud Storage', 'GEM/2024/B/5141492', 'Cloud', 1, 70000.00, 3200000.00, 
 'Bid Submitted', 'Submitted', CURDATE(), NOW()),

('Database Migration Services', 'DB-2024-008', 'DataFlow Systems', 'DataFlow', 'Gurgaon', 
 'Legacy to Cloud Migration', 'GEM/2024/B/5141493', 'Software', 1, 55000.00, 2400000.00, 
 'Bid Submitted', 'Submitted', CURDATE(), NOW());

-- Sample Won Opportunities (5 records)
INSERT INTO sepl_opportunities 
(title, reference_number, client_name, customer, location, tender_name, tender_number, requirement_type, 
 eligible, emd, estimated_value, current_stage, status, created_date, created_at)
VALUES
('Microsoft Office 365 Deployment', 'MS-365-001', 'CorporateIT', 'CorporateIT', 'New Delhi', 
 'Office Suite Cloud Services', 'GEM/2023/B/5140001', 'License', 1, 30000.00, 1500000.00, 
 'Won', 'Won', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),

('AWS Infrastructure Setup', 'AWS-001-2023', 'CloudFirst Corp', 'CloudFirst', 'Bangalore', 
 'Amazon Web Services Deployment', 'GEM/2023/B/5140002', 'Cloud', 1, 85000.00, 4200000.00, 
 'Won', 'Won', DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),

('Cybersecurity Framework Implementation', 'CYBER-001-2023', 'SecureOps', 'SecureOps', 'Mumbai', 
 'NIST Cybersecurity Framework', 'GEM/2023/B/5140003', 'Manpower/Consulting', 1, 50000.00, 2800000.00, 
 'Won', 'Won', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),

('Enterprise Hardware Bundle', 'HW-BUNDLE-001', 'TechEnterprise', 'TechEnterprise', 'Pune', 
 'Servers, Storage & Networking', 'GEM/2023/B/5140004', 'Hardware with Licenses', 1, 120000.00, 5600000.00, 
 'Won', 'Won', DATE_SUB(CURDATE(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 75 DAY)),

('Java Development Services', 'JAVA-DEV-001', 'SoftwareSolutions', 'SoftwareSolutions', 'Hyderabad', 
 'Custom Java Application Development', 'GEM/2023/B/5140005', 'Manpower/Consulting', 1, 65000.00, 3200000.00, 
 'Won', 'Won', DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY));

-- Sample Lost Opportunities (5 records) - with loss_reason
INSERT INTO sepl_opportunities 
(title, reference_number, client_name, customer, location, tender_name, tender_number, requirement_type, 
 eligible, emd, estimated_value, current_stage, status, loss_reason, created_date, created_at)
VALUES
('Apple Mac License Deal', 'APPLE-LOST-001', 'CreativeStudio', 'CreativeStudio', 'Mumbai', 
 'Apple Mac OS Licenses', 'GEM/2023/B/5140006', 'License', 0, 45000.00, 2200000.00, 
 'Lost', 'Lost', 'Budget constraints - Client selected cheaper alternative', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),

('SAP License Tender', 'SAP-LOST-002', 'EBiz Corp', 'EBiz', 'Bangalore', 
 'SAP Enterprise License', 'GEM/2023/B/5140007', 'License', 1, 95000.00, 4500000.00, 
 'Lost', 'Lost', 'Competitor offered better pricing and support package', DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)),

('Salesforce Implementation Project', 'SF-LOST-003', 'SalesPro', 'SalesPro', 'Delhi', 
 'CRM Platform Implementation', 'GEM/2023/B/5140008', 'Software', 1, 70000.00, 3400000.00, 
 'Lost', 'Lost', 'Client decided to extend existing vendor contract', DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),

('Linux Server Infrastructure', 'LINUX-LOST-004', 'OpenStack Inc', 'OpenStack', 'Gurgaon', 
 'Linux-based Infrastructure', 'GEM/2023/B/5140009', 'Hardware', 1, 55000.00, 2600000.00, 
 'Lost', 'Lost', 'Technical evaluation showed non-compliance with requirements', DATE_SUB(CURDATE(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 65 DAY)),

('Hadoop Big Data Cluster', 'HADOOP-LOST-005', 'DataAnalytics', 'DataAnalytics', 'Pune', 
 'Big Data Processing Infrastructure', 'GEM/2023/B/5140010', 'Hardware with Licenses', 1, 85000.00, 3900000.00, 
 'Lost', 'Lost', 'Procurement cancelled due to organizational restructuring', DATE_SUB(CURDATE(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 80 DAY));

-- Sample Archived Opportunities (5 records) - with archived_reason
INSERT INTO sepl_opportunities 
(title, reference_number, client_name, customer, location, tender_name, tender_number, requirement_type, 
 eligible, emd, estimated_value, current_stage, status, archived_reason, created_date, created_at)
VALUES
('Old Windows 7 Support Contract', 'WIN7-ARCHIVED-001', 'LegacyIT', 'LegacyIT', 'Mumbai', 
 'Windows 7 Extended Support', 'GEM/2022/B/5139001', 'License', 0, 15000.00, 800000.00, 
 'Lost', 'Archived', 'End-of-life product - no longer required', DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 120 DAY)),

('Legacy Mainframe Support', 'MAINFRAME-ARCHIVED-002', 'OldBank', 'OldBank', 'Delhi', 
 'Mainframe Maintenance Services', 'GEM/2022/B/5139002', 'Manpower/Consulting', 1, 40000.00, 2000000.00, 
 'Lost', 'Archived', 'System decommissioned - migrated to cloud', DATE_SUB(CURDATE(), INTERVAL 135 DAY), DATE_SUB(NOW(), INTERVAL 135 DAY)),

('Internal Project - Completed', 'INTERNAL-ARCHIVED-001', 'EasyReminder Inc', 'EasyReminder', 'Bangalore', 
 'Internal Tool Development', 'INT/2022/001', 'Software', 1, 0.00, 500000.00, 
 'Won', 'Archived', 'Project completed and archived for record keeping', DATE_SUB(CURDATE(), INTERVAL 150 DAY), DATE_SUB(NOW(), INTERVAL 150 DAY)),

('Test Tender - Cancelled', 'TEST-ARCHIVED-002', 'TestCorp', 'TestCorp', 'Hyderabad', 
 'Test Infrastructure Setup', 'GEM/2022/B/5139003', 'Cloud', 0, 20000.00, 1000000.00, 
 'Lost', 'Archived', 'Tender cancelled by procuring agency', DATE_SUB(CURDATE(), INTERVAL 160 DAY), DATE_SUB(NOW(), INTERVAL 160 DAY)),

('Demo Project - Reference Only', 'DEMO-ARCHIVED-001', 'DemoClient', 'DemoClient', 'Chennai', 
 'Demonstration Infrastructure', 'DEMO/2022/001', 'Hardware', 1, 10000.00, 600000.00, 
 'Lost', 'Archived', 'Demo setup - archived for reference purposes', DATE_SUB(CURDATE(), INTERVAL 180 DAY), DATE_SUB(NOW(), INTERVAL 180 DAY));

-- Step 5: Verify data insertion
SELECT 
  'OnGoing' as status, COUNT(*) as count 
FROM sepl_opportunities 
WHERE status = 'OnGoing'
UNION ALL
SELECT 
  'Submitted' as status, COUNT(*) as count 
FROM sepl_opportunities 
WHERE status = 'Submitted'
UNION ALL
SELECT 
  'Won' as status, COUNT(*) as count 
FROM sepl_opportunities 
WHERE status = 'Won'
UNION ALL
SELECT 
  'Lost' as status, COUNT(*) as count 
FROM sepl_opportunities 
WHERE status = 'Lost'
UNION ALL
SELECT 
  'Archived' as status, COUNT(*) as count 
FROM sepl_opportunities 
WHERE status = 'Archived'
ORDER BY status;

-- Summary statement
SELECT CONCAT(
  'Migration Complete! Total records: ', 
  (SELECT COUNT(*) FROM sepl_opportunities),
  ' - Status distribution shown above'
) as migration_status;
