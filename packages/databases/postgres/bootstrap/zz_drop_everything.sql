\set ON_ERROR_STOP on
\pset pager off
\pset linestyle ascii
\pset border 1
\timing on

\echo
\echo ========================================================================
\echo Hoolsy: DROP everything (databases + roles)
\echo Target DBs: users, workstation, marketplace
\echo Note: Run this while connected to the "postgres" DB.
\echo ========================================================================
\echo

\echo + Databases that currently exist (before):
SELECT datname AS existing_db
FROM pg_database
WHERE datname IN ('users','workstation','marketplace')
ORDER BY datname;

\echo
\echo + Active connections to target DBs (will terminate):
SELECT datname, usename, pid, state, application_name
FROM pg_stat_activity
WHERE datname IN ('users','workstation','marketplace')
ORDER BY datname, pid;

\echo
\echo + Terminating backends ...
SELECT pg_terminate_backend(pid) AS terminated_pid
FROM pg_stat_activity
WHERE datname IN ('users','workstation','marketplace')
  AND pid <> pg_backend_pid();

\echo
\echo + Dropping databases (if exist) ...
DROP DATABASE IF EXISTS users;
DROP DATABASE IF EXISTS workstation;
DROP DATABASE IF EXISTS marketplace;

\echo
\echo + Databases that exist now (after drop):
SELECT datname AS existing_db
FROM pg_database
WHERE datname IN ('users','workstation','marketplace')
ORDER BY datname;

\echo
\echo + Roles that currently exist (before drop):
SELECT rolname
FROM pg_roles
WHERE rolname IN ('users_owner','workstation_owner','marketplace_owner','svc_users','svc_workstation','svc_marketplace')
ORDER BY rolname;

\echo
\echo + Dropping service roles (if exist) ...
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_marketplace') THEN
    EXECUTE 'DROP ROLE svc_marketplace';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_workstation') THEN
    EXECUTE 'DROP ROLE svc_workstation';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_users') THEN
    EXECUTE 'DROP ROLE svc_users';
  END IF;
END$$;

\echo
\echo + Dropping owner roles (if exist) ...
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'marketplace_owner') THEN
    EXECUTE 'DROP ROLE marketplace_owner';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'workstation_owner') THEN
    EXECUTE 'DROP ROLE workstation_owner';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'users_owner') THEN
    EXECUTE 'DROP ROLE users_owner';
  END IF;
END$$;

\echo
\echo + Roles that exist now (after drop):
SELECT rolname
FROM pg_roles
WHERE rolname IN ('users_owner','workstation_owner','marketplace_owner','svc_users','svc_workstation','svc_marketplace')
ORDER BY rolname;

\echo
\echo Done: target databases and roles have been removed.
