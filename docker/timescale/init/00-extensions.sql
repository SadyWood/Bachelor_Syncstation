-- docker/timescale/init/00-extensions.sql
-- TimescaleDB initialization script

\echo '=============================================='
\echo 'Hoolsy TimescaleDB Initialization'
\echo '=============================================='

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for subject appearance events (analytics)
\echo 'Creating appearance_events hypertable...'
CREATE TABLE IF NOT EXISTS appearance_events (
    time TIMESTAMPTZ NOT NULL,
    subject_id TEXT NOT NULL,
    content_node_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'start', 'end', 'detected'
    duration_ms INTEGER,
    confidence DOUBLE PRECISION,
    metadata JSONB
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('appearance_events', 'time', if_not_exists => TRUE);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appearance_subject ON appearance_events (subject_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_appearance_content ON appearance_events (content_node_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_appearance_tenant ON appearance_events (tenant_id, time DESC);

-- Create continuous aggregate for daily stats
\echo 'Creating daily stats continuous aggregate...'
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_appearance_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    subject_id,
    tenant_id,
    COUNT(*) AS appearance_count,
    SUM(duration_ms) AS total_duration_ms,
    AVG(confidence) AS avg_confidence
FROM appearance_events
WHERE event_type = 'detected'
GROUP BY bucket, subject_id, tenant_id;

-- Add refresh policy (refresh every hour, covering last 3 days)
SELECT add_continuous_aggregate_policy('daily_appearance_stats',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create retention policy (keep detailed data for 90 days)
SELECT add_retention_policy('appearance_events', INTERVAL '90 days', if_not_exists => TRUE);

\echo '=============================================='
\echo 'TimescaleDB initialization complete!'
\echo '=============================================='
