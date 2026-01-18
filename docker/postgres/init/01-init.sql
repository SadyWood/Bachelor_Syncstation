-- ============================================
-- Initialize HK26 Consumer App Database
-- ============================================
-- This script sets up two databases:
-- 1. users_public - User authentication, carts, orders, favorites, addresses
-- 2. catalog_demo - Subjects, products, content (episodes), timeline

-- Create user
CREATE USER consumer_user WITH PASSWORD 'consumer_password';

-- ============================================
-- USERS_PUBLIC Database
-- ============================================
CREATE DATABASE users_public OWNER postgres;
\c users_public

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- UUIDv7 generation function (time-ordered UUIDs)
-- Based on IETF draft: https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid
AS $$
DECLARE
  unix_ts_ms BYTEA;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT) FROM 3);
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);
  RETURN encode(
    set_byte(set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::BIT(4))::BIT(8)::INT),
    8, (b'10' || (get_byte(uuid_bytes, 8)::BIT(6))::BIT(8)::INT)),
    'hex')::UUID;
END
$$
LANGUAGE plpgsql
VOLATILE;

-- Grant privileges
GRANT ALL ON SCHEMA public TO consumer_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO consumer_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO consumer_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO consumer_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO consumer_user;

-- ============================================
-- CATALOG_DEMO Database
-- ============================================
\c postgres
CREATE DATABASE catalog_demo OWNER postgres;
\c catalog_demo

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- UUIDv7 generation function (time-ordered UUIDs)
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid
AS $$
DECLARE
  unix_ts_ms BYTEA;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT) FROM 3);
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);
  RETURN encode(
    set_byte(set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::BIT(4))::BIT(8)::INT),
    8, (b'10' || (get_byte(uuid_bytes, 8)::BIT(6))::BIT(8)::INT)),
    'hex')::UUID;
END
$$
LANGUAGE plpgsql
VOLATILE;

-- Grant privileges
GRANT ALL ON SCHEMA public TO consumer_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO consumer_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO consumer_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO consumer_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO consumer_user;

-- ============================================
-- Summary
-- ============================================
-- Two databases created:
-- - users_public (users, carts, orders, favorites, addresses)
-- - catalog_demo (subjects, products, content, timeline)
--
-- Run migrations and seeding via:
-- pnpm db:reset
