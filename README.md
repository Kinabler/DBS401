# DBS401
----
## Name: Users Management

## Description: 
Dự án "User Management" được dev bằng ngôn ngữ **NodeJS** và sử dụng database chính là: **Oracle**. Trong website này có 1 vài vuln có thể được sử dụng cho môn DBS401.

## Function:
* Project này có phân quyền giữa Admin site và User site.
* Trong đó Admin Site có thêm chức năng view User Profile, Edit User Profile (Không bao gồm password).
* Có chức năng view profile của user đó và edit ảnh profile.

## Technique:
* JWT access token: Để thực hiện Authentication / Authorization
* Cookie: được sử dụng để lưu JWT access token phục vụ cho authorization
* Và một vài công nghệ khác được liệt kê trong ảnh dưới đây:

![image](https://github.com/user-attachments/assets/9a9d49b1-2a80-4adf-90c4-b2b491040ce8)

## Installation And Setup (Step-by-Step)

Tạo file setup.sh và lưu file lại với nội dung như sau:
```bash
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
# Spawn all docker container
echo "Starting Docker containers..."
sudo docker-compose up -d
# Initialize database
echo "Initializing database..."
sudo chmod +x init-db.sh
sudo ./init-db.sh

###############################################
# If you want to add domain into your website #
# ,please add IP into Record DNS first before #
# running this step, otherwise it will be     #
# raising a error message.                    #
###############################################

echo "Making config file for nginx..."
cat > sigrop.site << 'EOF'
server {
    listen 80;
    server_name sigrop.site www.sigrop.site;

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
```

Thiết lập quyền execute cho file setup.sh bằng command sau:
```bash
chmod +x ./setup.sh
```

Sau đó run file setup và đợi kết quả thành công thôi!!

## Demo:

![image](https://github.com/user-attachments/assets/a5026e71-a2c2-4de9-a671-e09fed6cde00)

### Admin Site:

![image](https://github.com/user-attachments/assets/069ed8ee-cc66-4947-8e3d-15ad319941b2)

### User Site:

![image](https://github.com/user-attachments/assets/254257a4-f35c-42b3-89a4-905c318baecd)
