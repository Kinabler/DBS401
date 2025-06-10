#!/bin/bash
set -e

# --- Configuration ---
PROJECT_DIR="DBS401"
NGINX_CONF_FILE="/etc/nginx/sites-available/dbs401"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/dbs401"
APP_PORT=8080 # Port của ứng dụng Node.js

# --- Main Script ---

# 1. Check for root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root. Please use sudo."
    exit 1
fi

echo "--- Starting Web Application Setup ---"

# 2. Check for required environment variables for git clone
if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_PAT" ]; then
    echo "Error: GITHUB_USERNAME and GITHUB_PAT must be set as environment variables."
    echo "Usage: GITHUB_USERNAME=... GITHUB_PAT=... sudo ./setup.sh"
    exit 1
fi

GIT_REPO_URL="https://${GITHUB_USERNAME}:${GITHUB_PAT}@github.com/Kinabler/DBS401.git"

# 3. Install required host packages
echo "Installing prerequisites..."
apt-get update
apt-get install -y git docker.io docker-compose nginx

systemctl start docker && systemctl enable docker

# 4. Clone source code
if [ -d "$PROJECT_DIR" ]; then
    echo "Removing existing project directory..."
    rm -rf "$PROJECT_DIR"
fi
echo "Cloning repository..."
git clone "$GIT_REPO_URL"
cd "$PROJECT_DIR"

# 5. Configure Nginx
echo "Configuring Nginx as a reverse proxy..."
cat <<EOF > "$NGINX_CONF_FILE"
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
if [ ! -L "$NGINX_CONF_LINK" ]; then
    ln -s "$NGINX_CONF_FILE" "$NGINX_CONF_LINK"
fi
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Build and run Docker containers
echo "Starting Docker containers..."
# docker-compose sẽ tự động sử dụng các biến môi trường bạn đã cung cấp
docker-compose up --build -d

# 7. Initialize database
echo "Waiting for the database... (20s)"
sleep 20
if [ -f "init-db.sh" ]; then
    echo "Initializing database..."
    chmod +x init-db.sh
    ./init-db.sh
fi

echo "--- Setup Complete! ---"