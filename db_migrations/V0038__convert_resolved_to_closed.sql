-- Convert all resolved tickets to closed status
UPDATE tickets SET status = 'closed' WHERE status = 'resolved';