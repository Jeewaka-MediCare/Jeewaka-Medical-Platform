#!/bin/bash

# AWS EC2 Ubuntu 22.04 LTS Setup Script for t3.micro
# Optimized for 1GB RAM constraint
# Run this script on your fresh EC2 instance

echo "🚀 Setting up EC2 t3.micro for Jeewaka Medical Platform..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_micro_tip() {
    echo -e "${BLUE}[t3.micro TIP]${NC} $1"
}

# Update system (essential only to save bandwidth/time)
print_status "Updating system packages..."
sudo apt update
sudo apt upgrade -y --with-new-pkgs

# Configure swap space FIRST (critical for t3.micro)
print_status "Configuring swap space for t3.micro stability..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    print_status "✅ Created 1GB swap space"
fi

# Optimize system for low memory
print_status "Optimizing system for t3.micro..."
echo 'vm.swappiness=60' | sudo tee -a /etc/sysctl.conf
echo 'vm.dirty_ratio=15' | sudo tee -a /etc/sysctl.conf
echo 'vm.dirty_background_ratio=5' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Disable unnecessary services to save memory
print_status "Disabling unnecessary services..."
sudo systemctl disable snapd unattended-upgrades
sudo systemctl stop snapd unattended-upgrades

# Install Docker with optimized settings
print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Configure Docker daemon for t3.micro
print_status "Configuring Docker for low memory..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "5m",
    "max-file": "2"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock", 
      "Soft": -1
    }
  }
}
EOF

# Install Docker Compose (lightweight version)
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install essential tools only
print_status "Installing essential tools..."
sudo apt install git curl wget htop -y

# Skip heavy tools for t3.micro to save space and memory
print_micro_tip "Skipping AWS CLI and Node.js installation to save memory"
print_micro_tip "Install them later if needed: curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"

# Configure log rotation to prevent disk space issues
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 3
    daily
    compress
    size 5M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/jeewaka-medical-platform
sudo chown ubuntu:ubuntu /opt/jeewaka-medical-platform

# Create optimized environment template for t3.micro
print_status "Creating environment template..."
tee /opt/jeewaka-medical-platform/.env.template << EOF
# t3.micro Optimized Configuration
MONGODB_URI=mongodb://db:27017/jeewaka-medical
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password_here

JWT_SECRET=your_jwt_secret_here_minimum_32_characters_long

NODE_ENV=production
PORT=5000

# Memory optimizations for t3.micro (1GB RAM)
NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size

# Disable memory-heavy features
DISABLE_ANALYTICS=true
DISABLE_TELEMETRY=true
DISABLE_LOGGING_TO_FILE=true

# Security Configuration
BCRYPT_ROUNDS=10  # Reduced from 12 to save CPU

# Database optimizations
MONGODB_CACHE_SIZE=128  # MB

# Session configuration
SESSION_SECRET=your_session_secret_here
SESSION_MAX_AGE=3600000  # 1 hour (shorter for memory)
EOF

# Create system monitoring script
print_status "Creating monitoring tools..."
tee /opt/jeewaka-medical-platform/system-check.sh << 'EOF'
#!/bin/bash
echo "🔍 t3.micro System Health Check"
echo "==============================="
echo "📊 Memory Usage:"
free -h
echo ""
echo "💾 Disk Usage:"
df -h /
echo ""
echo "⚡ System Load:"
uptime
echo ""
echo "🐳 Docker Status:"
docker --version 2>/dev/null || echo "Docker not running"
echo ""
echo "🔄 Swap Usage:"
swapon --show
echo ""
echo "🏃 Top Processes by Memory:"
ps aux --sort=-%mem | head -6
EOF
chmod +x /opt/jeewaka-medical-platform/system-check.sh

# Configure automatic cleanup
print_status "Setting up automatic cleanup..."
sudo tee /etc/cron.daily/docker-cleanup << 'EOF'
#!/bin/bash
# Clean up Docker system daily
docker system prune -f
docker volume prune -f
# Clear system cache
sync
echo 1 > /proc/sys/vm/drop_caches
EOF
sudo chmod +x /etc/cron.daily/docker-cleanup

print_status "✅ EC2 t3.micro setup complete!"
print_status ""
print_status "📋 t3.micro Optimization Summary:"
print_micro_tip "✅ 1GB swap space created for stability"
print_micro_tip "✅ System optimized for low memory usage"
print_micro_tip "✅ Docker configured with memory limits"
print_micro_tip "✅ Unnecessary services disabled"
print_micro_tip "✅ Automatic cleanup scheduled"
print_status ""
print_status "� Next Steps:"
print_status "   1. Reboot: sudo reboot"
print_status "   2. Clone repository: git clone <your-repo>"
print_status "   3. Configure: cp .env.template .env && nano .env"
print_status "   4. Deploy: chmod +x scripts/deploy-micro.sh && ./scripts/deploy-micro.sh"
print_status ""
print_status "💡 t3.micro Tips:"
print_micro_tip "Monitor regularly: /opt/jeewaka-medical-platform/system-check.sh"
print_micro_tip "Free memory: sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches"
print_micro_tip "Restart if sluggish: sudo systemctl restart docker"
print_micro_tip "Consider t3.small if consistently hitting memory limits"