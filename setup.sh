#!/bin/bash
# Exit on error
set -e
cd /
# Clean source
rm -rf DBS401
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
echo "=== CTF Challenge Cleanup Script ==="

# Kiểm tra và dừng containers
echo "Stopping containers..."
sudo docker-compose down 2>/dev/null || echo "No containers to stop"

# Kiểm tra image có tồn tại không
if docker images | grep -q "dbs401_app"; then
    echo "Image dbs401_app found, removing..."
    docker rmi dbs401_app
    echo "Image removed successfully"
else
    echo "Image dbs401_app not found, skipping removal"
fi

# Cleanup thêm nếu cần
echo "Cleaning up dangling images..."
docker image prune -f

echo "Cleanup completed!"
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