#!/bin/bash
# Exit on error
set -e

# Global variable to track error status
ERROR_STATUS=0

# Function to simulate try block
try() {
    echo "Executing: $@"
    if ! "$@"; then
        ERROR_STATUS=$?
        return $ERROR_STATUS
    fi
    ERROR_STATUS=0
    return 0
}

# Function to simulate catch block with retry logic
catch() {
    local error_code=$ERROR_STATUS
    local max_attempts=3
    local delay=5
    local attempt=1
    local cmd="$@"

    if [ $error_code -eq 0 ]; then
        return 0
    fi

    echo "Error occurred (exit code $error_code) for command: $cmd"
    while [ $attempt -le $max_attempts ]; do
        echo "Retry attempt $attempt of $max_attempts for: $cmd"
        if "$@"; then
            echo "Retry successful"
            ERROR_STATUS=0
            return 0
        fi
        echo "Retry failed. Waiting $delay seconds..."
        sleep $delay
        ((attempt++))
    done

    echo "Error: Command failed after $max_attempts attempts: $cmd"
    ERROR_STATUS=$error_code
    return $error_code
}

# Function to check internet connectivity
check_connectivity() {
    echo "Checking internet connectivity..."
    try ping -c 3 8.8.8.8 > /dev/null 2>&1
    if [ $ERROR_STATUS -ne 0 ]; then
        echo "Error: No internet connection. Please check your network and try again."
        exit 1
    fi
}

# Change to root directory
cd /

# Clean source
echo "Cleaning up previous DBS401 directory..."
try rm -rf DBS401
catch rm -rf DBS401 || echo "No DBS401 directory found, proceeding..."

# Check connectivity before proceeding
check_connectivity

# Install required packages
echo "Installing required packages..."
try sudo apt-get update
catch sudo apt-get update || { echo "Error: Failed to update package lists"; exit 1; }

try sudo apt-get install -y docker.io
catch sudo apt-get install -y docker.io || { echo "Error: Failed to install docker.io"; exit 1; }

try sudo apt-get install -y docker-compose
catch sudo apt-get install -y docker-compose || { echo "Error: Failed to install docker-compose"; exit 1; }

# Clone project
echo "Cloning repository..."
try git clone https://Kinabler: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@github.com/Kinabler/DBS401.git
catch git clone https://Kinabler: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@github.com/Kinabler/DBS401.git || {
    echo "Error: Failed to clone repository. Check your credentials or network connection."
    exit 1
}

try cd DBS401
catch cd DBS401 || { echo "Error: Failed to change to DBS401 directory"; exit 1; }

# Start Docker containers
echo "Starting Docker containers..."
echo "=== CTF Challenge Cleanup Script ==="

# Stop containers
echo "Stopping containers..."
try sudo docker-compose down 2>/dev/null
catch sudo docker-compose down 2>/dev/null || echo "No containers to stop"

# Check and remove image
if docker images | grep -q "dbs401_app"; then
    echo "Image dbs401_app found, removing..."
    try docker rmi dbs401_app
    catch docker rmi dbs401_app || { echo "Error: Failed to remove dbs401_app image"; exit 1; }
    echo "Image removed successfully"
else
    echo "Image dbs401_app not found, skipping removal"
fi

# Clean up dangling images
echo "Cleaning up dangling images..."
try docker image prune -f
catch docker image prune -f || { echo "Error: Failed to clean up dangling images"; exit 1; }

echo "Cleanup completed!"

# Build and start Docker containers
try sudo docker-compose up -d --build
catch sudo docker-compose up -d --build || { echo "Error: Failed to start Docker containers"; exit 1; }

# Initialize database
echo "Initializing database..."
if [ -f "init-db.sh" ]; then
    try sudo chmod +x init-db.sh
    catch sudo chmod +x init-db.sh || { echo "Error: Failed to set executable permissions for init-db.sh"; exit 1; }

    try sudo ./init-db.sh
    catch sudo ./init-db.sh || { echo "Error: Failed to initialize database"; exit 1; }
else
    echo "Error: init-db.sh not found."
    exit 1
fi

sudo mkdir -p /home/finaLrouNd/
sudo bash -c "echo 'Congratulations! You have successfully completed the CTF challenge!\nG2{Y0u_4r3_sup3rStar_1n_DBS401}' > /home/finaLrouNd/finalflag.txt"

# Configure firewall
echo "Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
    try sudo ufw enable
    catch sudo ufw enable || { echo "Error: Failed to enable ufw"; exit 1; }

    try sudo ufw allow ssh
    catch sudo ufw allow ssh || { echo "Error: Failed to allow SSH"; exit 1; }

    try sudo ufw allow http
    catch sudo ufw allow http || { echo "Error: Failed to allow HTTP"; exit 1; }

    # try sudo ufw allow 8080/tcp
    # catch sudo ufw allow 8080/tcp || { echo "Error: Failed to allow port 8080"; exit 1; }
    # try sudo ufw allow 1521/tcp
    # catch sudo ufw allow 1521/tcp || { echo "Error: Failed to allow port 1521"; exit 1; }
    echo "Firewall rules configured."
else
    echo "Warning: ufw not installed, skipping firewall configuration."
fi

echo "Setup completed successfully!"