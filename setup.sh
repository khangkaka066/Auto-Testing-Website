#!/bin/bash
set -e

APP_NAME="testpilot-backend"
REPO_URL="https://github.com/khangkaka066/Auto-Testing-Website"
APP_DIR="$HOME/Auto-Testing-Website"
BACKEND_DIR="$APP_DIR/backend"
DOMAIN="api.testpilot.cloud"
EMAIL="hungmanh190204@gmail.com"
PORT="5001"

sudo apt update
sudo apt install -y git nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull origin main
fi

cd "$BACKEND_DIR"

npm install

npx playwright install --with-deps

# tạo .env nếu chưa có
if [ ! -f ".env" ]; then
  nano .env
fi

pm2 delete "$APP_NAME" || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save

sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME

sudo nginx -t
sudo systemctl restart nginx

sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect

pm2 startup systemd -u $USER --hp $HOME

echo "Backend setup done: http://$DOMAIN"
