-- Add sepl_entry_number column to emd and epbg tables
-- This column stores the SEPL Entry Number for tracking purposes

USE easyreminder;

ALTER TABLE emd 
ADD COLUMN sepl_entry_number VARCHAR(100) NULL AFTER issuing_bank;

ALTER TABLE epbg 
ADD COLUMN sepl_entry_number VARCHAR(100) NULL AFTER issuing_bank;
