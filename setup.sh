# Install pre-require
sudo apt-get install docker.io -y
sudo apt  install docker-compose -y
sudo apt install nginx -y
sudo systemctl status nginx
sudo apt install certbot python3-certbot-nginx -y

# Cài đặt project (require auth)
git clone https:Kinabler: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//github.com/Kinabler/DBS401.git
cd DBS401
# Spawn all docker container
sudo docker-compose up -d
# Initialize database
sudo chmod +x init-db.sh
sudo ./init-db.sh
# Enable port from outside
ufw allow 1521/tcp
ufw allow 8080/tcp

echo "Make config file for nginx"
cat > sigrop.site << 'EOF'
server {
    listen 80;
    server_name sigrop.site www.sigrop.site;
    
    # Chuyển hướng tất cả HTTP sang HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name sigrop.site www.sigrop.site;
    
    # SSL configuration sẽ được certbot cấu hình tự động
    
    # Proxy tới ứng dụng Node.js
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Move config file into nginx
echo "Config nginx for domain sigrop.site..."
sudo mv sigrop.site /etc/nginx/sites-available/sigrop.site

sudo ln -sf /etc/nginx/sites-available/sigrop.site /etc/nginx/sites-enabled/

# delete default config for non-conflict
sudo rm -f /etc/nginx/sites-enabled/default

echo "Checking nginx configuration... "
sudo nginx -t

echo "Restart nginx..."
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