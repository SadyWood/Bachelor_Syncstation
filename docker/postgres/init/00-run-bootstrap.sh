#!/bin/sh
# docker/postgres/init/00-run-bootstrap.sh
# Runs the canonical PostgreSQL bootstrap scripts from packages/databases/postgres/bootstrap/
# This ensures Docker and production use the same setup scripts (single source of truth)

set -e

BOOTSTRAP_DIR="/bootstrap-scripts"

echo "=============================================="
echo "Hoolsy PostgreSQL Initialization (Docker)"
echo "Running canonical bootstrap from packages/"
echo "=============================================="

# Run bootstrap scripts in order
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
	\i $BOOTSTRAP_DIR/00_cluster_bootstrap.sql
	\i $BOOTSTRAP_DIR/10_users_db.sql
	\i $BOOTSTRAP_DIR/10_workstation_db.sql
	\i $BOOTSTRAP_DIR/10_marketplace_db.sql
EOSQL

echo "=============================================="
echo "PostgreSQL initialization complete!"
echo "=============================================="
