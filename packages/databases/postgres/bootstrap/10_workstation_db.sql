\set ON_ERROR_STOP on
\connect workstation

\echo
\echo [workstation] Configure DB owner, extensions and privileges

ALTER DATABASE workstation OWNER TO workstation_owner;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO workstation_owner;
ALTER SCHEMA public OWNER TO workstation_owner;

GRANT CONNECT ON DATABASE workstation TO svc_workstation;
GRANT USAGE ON SCHEMA public TO svc_workstation;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svc_workstation;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO svc_workstation;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_workstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_workstation;

ALTER DEFAULT PRIVILEGES FOR ROLE workstation_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_workstation;
ALTER DEFAULT PRIVILEGES FOR ROLE workstation_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_workstation;

\echo [workstation] Done.
