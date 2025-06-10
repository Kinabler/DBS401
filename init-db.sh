#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check and open pluggable database
check_and_open_pdb() {
    log_info "Checking pluggable database status..."
    
    # Check if XEPDB1 is open
    PDB_STATUS=$(docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
set heading off
set feedback off
set pagesize 0
SELECT open_mode FROM v\$pdbs WHERE name = 'XEPDB1';
EXIT;
EOF
    )
    
    if echo "$PDB_STATUS" | grep -q "READ WRITE"; then
        log_info "Pluggable database XEPDB1 is already open"
        return 0
    else
        log_info "Opening pluggable database XEPDB1..."
        docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
ALTER PLUGGABLE DATABASE XEPDB1 OPEN;
EXIT;
EOF
        
        # Verify it's now open
        PDB_STATUS_AFTER=$(docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
set heading off
set feedback off
set pagesize 0
SELECT open_mode FROM v\$pdbs WHERE name = 'XEPDB1';
EXIT;
EOF
        )
        
        if echo "$PDB_STATUS_AFTER" | grep -q "READ WRITE"; then
            log_info "Pluggable database XEPDB1 opened successfully"
            return 0
        else
            log_error "Failed to open pluggable database XEPDB1"
            return 1
        fi
    fi
}

# Function to check if Oracle is ready
check_oracle_ready() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Checking Oracle readiness (attempt $attempt/$max_attempts)..."
        
        # Check if container is running
        if ! docker-compose ps oracle-db | grep -q "Up"; then
            log_warn "Oracle container is not running"
            sleep 10
            ((attempt++))
            continue
        fi
        
        # Check database status
        if docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
set heading off
set feedback off
set pagesize 0
SELECT 'DB_READY' FROM dual;
EXIT;
EOF
        then
            # Database is ready, now check pluggable database
            if check_and_open_pdb; then
                log_info "Oracle Database and PDB are ready!"
                return 0
            else
                log_warn "Pluggable database not ready yet, waiting..."
                sleep 10
                ((attempt++))
                continue
            fi
        fi
        
        log_warn "Database not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Oracle Database failed to become ready after $max_attempts attempts"
    return 1
}

# Function to check and fix process limits
check_process_limits() {
    log_info "Checking Oracle process limits..."
    
    docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
set heading off
set feedback off
set pagesize 0
SELECT 'Current processes: ' || COUNT(*) FROM v\$process;
SELECT 'Max processes: ' || value FROM v\$parameter WHERE name = 'processes';

-- Check if we're close to the limit
DECLARE
  current_procs NUMBER;
  max_procs NUMBER;
BEGIN
  SELECT COUNT(*) INTO current_procs FROM v\$process;
  SELECT value INTO max_procs FROM v\$parameter WHERE name = 'processes';
  
  IF current_procs > (max_procs * 0.8) THEN
    DBMS_OUTPUT.PUT_LINE('WARNING: Process usage is high: ' || current_procs || '/' || max_procs);
  END IF;
END;
/
EXIT;
EOF
}

# Main execution
main() {
    log_info "Starting Oracle Database setup..."
    log_info "Current time: $(date '+%Y-%m-%d %H:%M:%S UTC')"
    
    # Check if database/user.sql exists
    if [ ! -f "database/user.sql" ]; then
        log_error "database/user.sql not found!"
        exit 1
    fi
    
    # Wait for Oracle to be ready
    if ! check_oracle_ready; then
        log_error "Oracle Database setup failed - database not ready"
        exit 1
    fi
    
    # Check process limits
    check_process_limits
    
    # Check listener status
    log_info "Checking listener status..."
    docker-compose exec -T oracle-db lsnrctl status || log_warn "Listener check failed"
    
    # Create user with better error handling
    log_info "Creating database user..."
    CREATE_USER_RESULT=$(docker-compose exec -T oracle-db sqlplus -s / as sysdba << EOF
SET ECHO OFF
SET FEEDBACK ON
SET HEADING OFF
SET PAGESIZE 0
SET SERVEROUTPUT ON SIZE 1000000

-- First ensure we're connected to the right container
ALTER SESSION SET CONTAINER=XEPDB1;

-- Check if user already exists and create user
DECLARE
  user_count NUMBER;
BEGIN
  -- Check if user exists
  SELECT COUNT(*) INTO user_count FROM dba_users WHERE username = 'DBS401';
  
  IF user_count > 0 THEN
    DBMS_OUTPUT.PUT_LINE('USER_EXISTS');
    EXECUTE IMMEDIATE 'DROP USER dbs401 CASCADE';
    DBMS_OUTPUT.PUT_LINE('OLD_USER_DROPPED');
  END IF;
  
  -- Create the user
  EXECUTE IMMEDIATE 'CREATE USER dbs401 IDENTIFIED BY try_t0_hack_dbs401';
  DBMS_OUTPUT.PUT_LINE('USER_CREATED');
  
  -- Grant privileges
  EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE TO dbs401';
  DBMS_OUTPUT.PUT_LINE('PRIVILEGES_GRANTED');
  
  -- Set quota
  EXECUTE IMMEDIATE 'ALTER USER dbs401 QUOTA UNLIMITED ON USERS';
  DBMS_OUTPUT.PUT_LINE('QUOTA_SET');
  
  DBMS_OUTPUT.PUT_LINE('USER_CREATED_SUCCESS');
  
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
    RAISE;
END;
/

EXIT;
EOF
)

    # Parse and log the output
    if echo "$CREATE_USER_RESULT" | grep -q "USER_CREATED_SUCCESS"; then
        log_info "Database user created successfully"
    elif echo "$CREATE_USER_RESULT" | grep -q "ERROR:"; then
        log_error "Error during user creation: $(echo "$CREATE_USER_RESULT" | grep 'ERROR:')"
        exit 1
    else
        log_error "Failed to create database user"
        log_error "Output: $CREATE_USER_RESULT"
        exit 1
    fi
    
    # Copy SQL file to container
    log_info "Copying database script to container..."
    CONTAINER_ID=$(docker-compose ps -q oracle-db)
    if [ -z "$CONTAINER_ID" ]; then
        log_error "Could not find Oracle container ID"
        exit 1
    fi
    
    if ! docker cp database/user.sql "$CONTAINER_ID:/tmp/oracle_setup.sql"; then
        log_error "Failed to copy SQL file to container"
        exit 1
    fi
    
    # Execute the SQL file
    log_info "Running database setup script..."
    SCRIPT_RESULT=$(docker-compose exec -T oracle-db sqlplus -s dbs401/try_t0_hack_dbs401@//localhost:1521/XEPDB1 << EOF
WHENEVER SQLERROR EXIT SQL.SQLCODE
SET ECHO ON
SET FEEDBACK ON
@/tmp/oracle_setup.sql
SELECT 'SCRIPT_COMPLETED' FROM dual;
EXIT;
EOF
)
    
    if echo "$SCRIPT_RESULT" | grep -q "SCRIPT_COMPLETED"; then
        log_info "Database setup script executed successfully"
        
        # Only remove the file after successful execution
        log_info "Cleaning up SQL file..."
        rm -f database/user.sql
        
        log_info "Database setup completed successfully!"
    else
        log_error "Database setup script failed"
        log_error "Output: $SCRIPT_RESULT"
        
        # Try alternative connection method
        log_info "Trying alternative connection method..."
        ALT_RESULT=$(docker-compose exec -T oracle-db sqlplus -s dbs401/try_t0_hack_dbs401@XEPDB1 << EOF
@/tmp/oracle_setup.sql
SELECT 'ALT_SCRIPT_COMPLETED' FROM dual;
EXIT;
EOF
)
        
        if echo "$ALT_RESULT" | grep -q "ALT_SCRIPT_COMPLETED"; then
            log_info "Database setup completed with alternative method"
            rm -f database/user.sql
        else
            log_error "Both connection methods failed"
            exit 1
        fi
    fi
    
    # Final verification
    log_info "Verifying setup..."
    docker-compose exec -T oracle-db sqlplus -s dbs401/try_t0_hack_dbs401@//localhost:1521/XEPDB1 << EOF
SELECT 'Connection test: SUCCESS' FROM dual;
EXIT;
EOF
    
    log_info "All setup tasks completed!"
}

# Run main function
main "$@"