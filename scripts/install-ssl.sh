#!/bin/bash
# install-ssl.sh - Automates Let's Encrypt SSL setup for the Debian Gateway

echo "Starting Let's Encrypt SSL Installation..."

# Install certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Request certificate (replace yourdomain.com with the actual domain in production)
# For now, we use a placeholder or ask the user for the domain via environment variable
DOMAIN=${1:-portal.honduras.ford.com}

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email it-admin@yude.com.hn

# Update nginx config is handled by certbot --nginx
systemctl reload nginx

echo "SSL Installation Complete for $DOMAIN"
