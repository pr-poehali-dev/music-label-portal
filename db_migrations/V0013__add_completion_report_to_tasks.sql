-- Add completion_report column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_report TEXT;
