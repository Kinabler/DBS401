#!/bin/bash
# Exit on error
set -e

echo "Installing required packages..."
# Install pre-require
sudo apt-get update
sudo apt-get install docker.io -y
sudo apt install docker-compose -y
sudo apt install nginx -y
sudo systemctl status nginx --no-pager
sudo apt install certbot python3-certbot-nginx -y

# Cài đặt project (require auth)
echo "Cloning repository..."
git clone https://Kinabler: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@github.com/Kinabler/DBS401.git
cd DBS401

echo "Copying web source to /var/www/html..."
sudo mkdir -p /var/www/html
# Copy contents of the current directory (DBS401) to /var/www/html
# Using rsync to avoid issues with copying '.' into a subdirectory of itself if /var/www/html is inside DBS401
# However, assuming /var/www/html is a standard system path, cp -R . should be fine.
# Adding a trailing slash to source ensures contents are copied, not the directory itself.
sudo cp -R ./ /var/www/html/
# Set ownership for Apache user, though Apache is not installed by this script
sudo chown -R www-data:www-data /var/www/html || echo "Chown to www-data failed, perhaps user does not exist. This is okay if Apache is not the primary server."


# Spawn all docker container
echo "Starting Docker containers..."
sudo docker-compose up -d
# Initialize database
echo "Initializing database..."
sudo chmod +x init-db.sh
sudo ./init-db.sh

echo "Making config file for nginx..."
cat > sigrop.site << 'EOF'
server {
    listen 80;
    server_name sigrop.site www.sigrop.site;

    # Tối ưu cho các challenge CTF cần nhận path lạ, LFI, bypass, v.v.
    ignore_invalid_headers off;
    client_max_body_size 50M;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log debug;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $http_connection;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Không dùng try_files để tránh nginx kiểm tra file local
        # Không dùng rewrite hoặc rule chặn path

        # Cho phép path đặc biệt, không encode lại uri
        proxy_pass_request_headers on;
    }
}
EOF

# Move config file into nginx
echo "Configuring nginx for domain sigrop.site..."
sudo mv sigrop.site /etc/nginx/sites-available/sigrop.site

sudo ln -sf /etc/nginx/sites-available/sigrop.site /etc/nginx/sites-enabled/

# delete default config for non-conflict
sudo rm -f /etc/nginx/sites-enabled/default

echo "Checking nginx configuration... "
sudo nginx -t

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Installing SSL certificate..."
sudo certbot --nginx -d sigrop.site -d www.sigrop.site \
  --non-interactive \
  --agree-tos \
  --email 0nlyy0uteam1002@gmail.com \
  --eff-email \
  --redirect

echo "Checking auto renew of SSL certificate..."
sudo certbot renew --dry-run

sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
echo "y" | sudo ufw enable
sudo ufw status

echo "Install and Setup configuration has been done!"