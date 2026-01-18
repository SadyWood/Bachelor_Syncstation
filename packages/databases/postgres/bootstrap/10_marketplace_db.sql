\set ON_ERROR_STOP on
\connect marketplace

\echo
\echo [marketplace] Configure DB owner, extensions and privileges

ALTER DATABASE marketplace OWNER TO marketplace_owner;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO marketplace_owner;
ALTER SCHEMA public OWNER TO marketplace_owner;

GRANT CONNECT ON DATABASE marketplace TO svc_marketplace;
GRANT USAGE ON SCHEMA public TO svc_marketplace;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svc_marketplace;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO svc_marketplace;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_marketplace;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_marketplace;

ALTER DEFAULT PRIVILEGES FOR ROLE marketplace_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svc_marketplace;
ALTER DEFAULT PRIVILEGES FOR ROLE marketplace_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO svc_marketplace;

\echo [marketplace] Done.
