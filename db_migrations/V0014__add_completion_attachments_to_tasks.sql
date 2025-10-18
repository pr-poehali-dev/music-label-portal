-- Add completion report attachment fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_attachment_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_attachment_size INTEGER;
