-- Add attachment fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Add attachment fields to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachment_size INTEGER;