CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    position VARCHAR(255) NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    workplace VARCHAR(255) NOT NULL,
    duties TEXT NOT NULL,
    salary VARCHAR(100) NOT NULL,
    contact VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
