#!/bin/bash
echo "Waiting for Oracle Database to be ready..."
sleep 60  # Initial wait time for Oracle to start

echo "Checking SQLPlus version..."
# Check sqlplus version
docker-compose exec -T oracle-db sqlplus -V

echo "Checking Oracle Database version..."
# Check database version
docker-compose exec -T oracle-db sqlplus -s system/kienpt2003@//localhost:1521/XEPDB1 << EOF
set heading off
set feedback off
set pagesize 0
set echo off
set trimspool on
SELECT banner FROM v\$version;
EXIT;
EOF

# Try to connect and create the user
until docker-compose exec -T oracle-db sqlplus system/kienpt2003@//localhost:1521/XEPDB1 << EOF
CREATE USER dbs401 IDENTIFIED BY dbs401f0rEasy;
GRANT CONNECT, RESOURCE TO dbs401;
ALTER USER dbs401 QUOTA UNLIMITED ON USERS;
EXIT;
EOF
do
  echo "Oracle not ready yet or user already exists. Waiting 10 seconds..."
  sleep 10
done

echo "Database user created successfully!"

# Copy the SQL file to the container
echo "Copying database script to container..."
# Get the container ID first
CONTAINER_ID=$(docker-compose ps -q oracle-db)
# Then copy the file
docker cp database/user.sql $CONTAINER_ID:/tmp/oracle_setup.sql

if [ ! -f "database/user.sql" ]; then
  echo "Error: database/user.sql not found!"
  exit 1
fi


# Execute the SQL file
echo "Running database setup script..."
docker-compose exec -T oracle-db sqlplus dbs401/dbs401f0rEasy@//localhost:1521/XEPDB1 @/tmp/oracle_setup.sql

sudo rm -rf database/user.sql

echo "Database setup completed!"