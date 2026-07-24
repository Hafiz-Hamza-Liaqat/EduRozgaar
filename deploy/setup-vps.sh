#!/usr/bin/env bash
# Strideto VPS initial setup (Ubuntu 22.04+). Run as root or with sudo.
# Usage: sudo bash deploy/setup-vps.sh

set -euo pipefail

echo "==> Updating system packages..."
apt-get update && apt-get upgrade -y

echo "==> Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

echo "==> Installing Docker Compose plugin..."
apt-get install -y docker-compose-plugin git ufw curl

echo "==> Configuring firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Firewall: only SSH (22), HTTP (80), HTTPS (443) open."

echo "==> Installing Caddy..."
if ! command -v caddy &>/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

echo ""
echo "✅ VPS base setup complete."
echo ""
echo "Next steps:"
echo "  1. Point your domain A record to this server's public IP"
echo "  2. Clone repo: git clone https://github.com/SyedDaniyal31/Strideto.git && cd Strideto"
echo "  3. cp .env.template .env && edit .env (JWT_SECRET, SITE_URL, MAIL_*)"
echo "  4. bash deploy/deploy.sh"
echo "  5. Edit deploy/Caddyfile with your domain, then:"
echo "     sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy"
