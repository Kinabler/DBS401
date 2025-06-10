#!/bin/bash
# Exit on error
set -e
cd /
echo "Installing required packages..."
# Install pre-require
sudo apt-get update
sudo apt-get install docker.io -y
sudo apt install docker-compose -y

# Cài đặt project (require auth)
echo "Cloning repository..."
git clone https://Kinabler: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@github.com/Kinabler/DBS401.git
cd DBS401
# Spawn all docker container
echo "Starting Docker containers..."
sudo docker-compose build --no-cache
sudo docker-compose up -d
# Initialize database
echo "Initializing database..."
sudo chmod +x init-db.sh
sudo ./init-db.sh

# Add config file
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 8080/tcp
sudo ufw allow 1521/tcp

echo "Install and Setup configuration has been done!"