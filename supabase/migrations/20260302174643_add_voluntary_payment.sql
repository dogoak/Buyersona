-- Add is_voluntary_payment column to track reports generated via free trial
ALTER TABLE business_reports
ADD COLUMN is_voluntary_payment BOOLEAN DEFAULT FALSE;
