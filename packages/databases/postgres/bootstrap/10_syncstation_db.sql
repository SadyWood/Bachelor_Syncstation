\set ON_ERROR_STOP on
\connect syncstation

\echo
\echo [syncstation] Configure DB owner, extensions and privileges

ALTER DATABASE syncstation OWNER TO syncstation_owner;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO syncstation_owner;
ALTER SCHEMA public OWNER TO syncstation_owner;

GRANT CONNECT ON DATABASE syncstation TO svc_syncstation;
GRANT USAGE ON SCHEMA public TO svc_syncstation;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svc_syncstation;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO svc_syncstation;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_syncstation;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_syncstation;

ALTER DEFAULT PRIVILEGES FOR ROLE syncstation_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_syncstation;
ALTER DEFAULT PRIVILEGES FOR ROLE syncstation_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_syncstation;

\echo [syncstation] Done.
