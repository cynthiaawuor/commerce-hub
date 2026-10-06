#!/bin/sh
# Runs once, when the Postgres volume is first created.
#
# One Postgres server holds a separate database per service, each owned by its own login.
# A service's login can connect to its own database and nothing else, so no service can
# read another's data: the same isolation as one server per service, for far less memory.
set -eu

create() {
  user="$1"
  database="$2"
  password="$3"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
CREATE ROLE "$user" LOGIN PASSWORD '$password';
CREATE DATABASE "$database" OWNER "$user";
REVOKE CONNECT ON DATABASE "$database" FROM PUBLIC;
SQL
  echo "Created $database for $user"
}

create vendor      service-vendor      "$VENDOR_DB_PASSWORD"
create procurement service-procurement "$PROCUREMENT_DB_PASSWORD"
create inventory   service-inventory   "$INVENTORY_DB_PASSWORD"
create receiving   service-receiving   "$RECEIVING_DB_PASSWORD"
create warehouse   service-warehouse   "$WAREHOUSE_DB_PASSWORD"
create pos         service-pos         "$POS_DB_PASSWORD"
create sales_audit service-sales-audit "$SALES_AUDIT_DB_PASSWORD"
create financials  service-financials  "$FINANCIALS_DB_PASSWORD"
