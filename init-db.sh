#!/bin/bash
echo "Waiting for Oracle Database to be ready..."
sleep 60  # Increase initial wait time

echo "Checking if Oracle container is running..."
docker-compose ps oracle-db

echo "Checking listener status..."
docker-compose exec -T oracle-db lsnrctl status || echo "Listener check failed"

echo "Attempting to connect as SYSDBA..."
# Try to connect as sysdba first to check database availability
docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
set heading off
set feedback off
set pagesize 0
SELECT 'Database is available' FROM dual;
SELECT name FROM v\$active_services;
EXIT;
EOF

# Modified connection string - try with ORCLCDB or XE if XEPDB1 doesn't work
echo "Attempting to create user..."
docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
ALTER SESSION SET CONTAINER=XEPDB1;
CREATE USER dbs401 IDENTIFIED BY try_t0_hack_dbs401;
GRANT CONNECT, RESOURCE TO dbs401;
ALTER USER dbs401 QUOTA UNLIMITED ON USERS;
EXIT;
EOF

echo "Database user creation attempted!"

# Increase the maximum processes parameter
echo "Increasing database process limit..."
docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
ALTER SYSTEM SET processes=600 SCOPE=SPFILE;
ALTER SYSTEM SET sessions=600 SCOPE=SPFILE;
SHUTDOWN IMMEDIATE;
STARTUP;
EXIT;
EOF

# Give the database a moment to restart before proceeding
sleep 30
echo "Database restarted with increased process limit"

# Check if the SQL file exists before copying
if [ ! -f "database/user.sql" ]; then
  echo "Error: database/user.sql not found!"
  exit 1
fi

# Copy the SQL file to the container
echo "Copying database script to container..."
CONTAINER_ID=$(docker-compose ps -q oracle-db)
docker cp database/user.sql $CONTAINER_ID:/tmp/oracle_setup.sql

# Execute the SQL file with the appropriate connection
echo "Running database setup script..."
docker-compose exec -T oracle-db sqlplus dbs401/try_t0_hack_dbs401@//localhost:1521/XEPDB1 @/tmp/oracle_setup.sql || echo "Failed to run setup script, trying alternative connection"

# Try alternative connection if the first one fails
if [ $? -ne 0 ]; then
  echo "Trying alternative connection method..."
  docker-compose exec -T oracle-db sqlplus dbs401/try_t0_hack_dbs401@XEPDB1 @/tmp/oracle_setup.sql
fi

# sudo rm -rf database/user.sql

echo "Database setup completed!"
