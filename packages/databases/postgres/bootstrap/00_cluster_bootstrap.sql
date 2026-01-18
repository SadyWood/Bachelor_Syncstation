\set ON_ERROR_STOP on
\pset pager off
\pset linestyle ascii
\pset border 1

\echo
\echo ========================= Hoolsy Bootstrap (cluster) =========================
\echo Target DBs: users, workstation, marketplace
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
\set ON_ERROR_STOP on
