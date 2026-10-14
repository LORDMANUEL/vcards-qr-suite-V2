#!/bin/bash

# Captive Portal Gateway Setup Script for WSL/Debian/Ubuntu
# Targets: Cudy 1200 Access Point Integration

# 1. Update and Install Dependencies
echo "Installing networking and security tools..."
sudo apt-get update
sudo apt-get install -y iptables iptables-persistent fail2ban curl

# 2. Configure IP Tables for Captive Portal Redirection
# Assuming eth0 or wlan0 is the interface. We'll use variables.
IFACE=$(ip route | grep default | awk '{print $5}' | head -n 1)
PORT=3001

echo "Configuring iptables for redirection on interface $IFACE to port $PORT..."

# Redirigir traffic HTTP (80) al Portal Cautivo Local (3001)
# Solo para IPs que NO están autorizadas (esto es un ejemplo simplificado)
# En un entorno real, usarías un módulo de 'ipset' para MACs autorizadas.

# Limpiar reglas previas
sudo iptables -t nat -F

# Permitir DNS
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j ACCEPT
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j ACCEPT

# Permitir tráfico al servidor del portal cautivo
SERVER_IP=$(hostname -I | awk '{print $1}')
sudo iptables -t nat -A PREROUTING -d $SERVER_IP -j ACCEPT

# Redirigir el resto del tráfico HTTP al portal
# sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports $PORT

# Guardar reglas
# sudo iptables-save | sudo tee /etc/iptables/rules.v4

# 3. Fail2ban Configuration to prevent brute force on portal
echo "Configuring fail2ban..."

sudo tee /etc/fail2ban/jail.local <<EOF
[vcard-system]
enabled = true
port = 3001
filter = vcard-errors
logpath = /var/log/vcard-system.log
maxretry = 5
bantime = 3600
EOF

sudo tee /etc/fail2ban/filter.d/vcard-errors.conf <<EOF
[Definition]
failregex = ^.*ERROR.*IP:<HOST>.*$
ignoreregex =
EOF

sudo systemctl restart fail2ban

echo "Captive Gateway Setup Complete."
echo "Note: Manual adjustment of iptables might be required depending on the Access Point redirection behavior."
