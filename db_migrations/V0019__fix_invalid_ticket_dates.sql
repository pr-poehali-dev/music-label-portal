-- Fix invalid dates in tickets table (year 19900 -> 2025)
UPDATE tickets 
SET deadline = CASE 
    WHEN EXTRACT(YEAR FROM deadline) > 10000 THEN NULL
    ELSE deadline 
END
WHERE deadline IS NOT NULL AND EXTRACT(YEAR FROM deadline) > 10000;

UPDATE tickets 
SET completed_at = CASE 
    WHEN EXTRACT(YEAR FROM completed_at) > 10000 THEN NULL
    ELSE completed_at 
END
WHERE completed_at IS NOT NULL AND EXTRACT(YEAR FROM completed_at) > 10000;

UPDATE tickets 
SET created_at = CURRENT_TIMESTAMP
WHERE EXTRACT(YEAR FROM created_at) > 10000;