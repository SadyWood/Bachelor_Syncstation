\set ON_ERROR_STOP on
\pset pager off
\pset linestyle ascii
\pset border 1

\echo
\echo ========================= HK26 Bootstrap (cluster) =========================
\echo Target DBs: users, workstation, syncstation
\echo ============================================================================
\echo

\echo [Roles] Creating OWNER roles (if missing) ...
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'users_owner') THEN
    CREATE ROLE users_owner LOGIN PASSWORD 'change-this-users';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'workstation_owner') THEN
    CREATE ROLE workstation_owner LOGIN PASSWORD 'change-this-workstation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'marketplace_owner') THEN
    CREATE ROLE marketplace_owner LOGIN PASSWORD 'change-this-marketplace';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'syncstation_owner') THEN
    CREATE ROLE syncstation_owner LOGIN PASSWORD 'change-this-syncstation';
  END IF;
END$$;

\echo
\echo [Roles] Creating SERVICE roles (least-privilege; if missing) ...
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_users') THEN
    CREATE ROLE svc_users LOGIN PASSWORD 'change-this-svc-users';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_workstation') THEN
    CREATE ROLE svc_workstation LOGIN PASSWORD 'change-this-svc-workstation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_marketplace') THEN
    CREATE ROLE svc_marketplace LOGIN PASSWORD 'change-this-svc-marketplace';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_syncstation') THEN
    CREATE ROLE svc_syncstation LOGIN PASSWORD 'change-this-svc-syncstation';
  END IF;
END$$;

\echo
\echo [Databases] Creating databases if missing ...
\set ON_ERROR_STOP off
\echo -n ' - users ... '
CREATE DATABASE users OWNER users_owner ENCODING 'UTF8' TEMPLATE template1;
\echo ok
\echo -n ' - workstation ... '
CREATE DATABASE workstation OWNER workstation_owner ENCODING 'UTF8' TEMPLATE template1;
\echo ok
\echo -n ' - marketplace ... '
CREATE DATABASE marketplace OWNER marketplace_owner ENCODING 'UTF8' TEMPLATE template1;
\echo ok
\echo -n ' - syncstation ... '
CREATE DATABASE syncstation OWNER syncstation_owner ENCODING 'UTF8' TEMPLATE template1;
\echo ok
\set ON_ERROR_STOP on

-- ============================================================================
-- GRANTS - Service accounts need access to tables in their databases
-- Run after migrations have created tables
-- ============================================================================

\echo
\echo [Grants] Granting service account permissions ...

\echo -n ' - users ... '
\connect users
GRANT USAGE ON SCHEMA public TO svc_users;
GRANT ALL ON ALL TABLES IN SCHEMA public TO svc_users;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO svc_users;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO svc_users;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO svc_users;
\echo ok

\echo -n ' - workstation ... '
\connect workstation
GRANT USAGE ON SCHEMA public TO svc_workstation;
GRANT ALL ON ALL TABLES IN SCHEMA public TO svc_workstation;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO svc_workstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO svc_workstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO svc_workstation;
\echo ok

\echo -n ' - syncstation ... '
\connect syncstation
GRANT USAGE ON SCHEMA public TO svc_syncstation;
GRANT ALL ON ALL TABLES IN SCHEMA public TO svc_syncstation;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO svc_syncstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO svc_syncstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO svc_syncstation;
\echo ok

\echo
\echo ========================= Bootstrap complete =========================
```
