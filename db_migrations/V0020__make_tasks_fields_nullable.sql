-- Make assigned_to and deadline nullable in tasks table
ALTER TABLE tasks ALTER COLUMN assigned_to SET DEFAULT NULL;
ALTER TABLE tasks ALTER COLUMN deadline SET DEFAULT NULL;