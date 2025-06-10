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

# Config apache
sudo apt update
sudo apt install apache2 -y
sudo a2enmod proxy proxy_http

# Configure virtual host for sigrop.site
sudo tee /etc/apache2/sites-available/sigrop-site.conf > /dev/null <<EOL
<VirtualHost *:80>
    ServerName sigrop.site
    ServerAlias www.sigrop.site

    ProxyPreserveHost On
    
    ProxyPass / http://localhost:8080/ retry=0
    ProxyPassReverse / http://localhost:8080/
    
    AllowEncodedSlashes On
    
    LimitRequestFieldSize 32768
    LimitRequestLine 32768

    # Bỏ dòng AllowDotInPath On vì không tồn tại
    
    ErrorLog ${APACHE_LOG_DIR}/sigrop-error.log
    CustomLog ${APACHE_LOG_DIR}/sigrop-access.log combined
    
    # Thêm các directive bảo mật (tùy chọn)
    ProxyTimeout 300
    ProxyBadHeader Ignore
</VirtualHost>
EOL

sudo a2ensite sigrop-site.conf
sudo systemctl reload apache2

# Add domain to /etc/hosts for local testing
if ! grep -q "sigrop.site" /etc/hosts; then
    echo "127.0.0.1 sigrop.site www.sigrop.site" | sudo tee -a /etc/hosts
fi

sudo systemctl restart apache2
sudo ufw allow 80/tcp
