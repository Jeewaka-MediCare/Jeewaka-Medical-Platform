#!/bin/bash

# t3.micro Optimized Deployment Script
# Specifically designed for AWS t3.micro instances (1GB RAM)

set -e  # Exit on any error

echo "🚀 Starting Jeewaka Medical Platform deployment on t3.micro..."

# Color codes for output
RED='\033[0;31# Memory usage by containers
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep -E "(backend|web)")
print_status "Memory usage by containers:"
echo "$MEMORY_USAGE"

# Check backend health
if curl -f --max-time 10 http://localhost:5000/health > /dev/null 2>&1; then
    print_status "✅ Backend service is healthy"
else
    print_warning "⚠️ Backend health check failed - checking logs..."
    docker-compose -f docker-compose.micro.yml --env-file .env.production logs --tail=10 backend
fi

# Check frontend
if curl -f --max-time 10 http://localhost:80 > /dev/null 2>&1; then
    print_status "✅ Frontend service is healthy"
else
    print_warning "⚠️ Frontend health check failed - checking logs..."
    docker-compose -f docker-compose.micro.yml --env-file .env.production logs --tail=10 web
fi'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_micro_tip() {
    echo -e "${BLUE}[t3.micro TIP]${NC} $1"
}

# Check system resources
print_status "Checking t3.micro system resources..."
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')

print_status "Total RAM: ${TOTAL_MEM}MB, Available: ${AVAILABLE_MEM}MB"

if [ "$TOTAL_MEM" -lt 900 ]; then
    print_warning "Less than 1GB RAM detected. This might not be a t3.micro instance."
fi

if [ "$AVAILABLE_MEM" -lt 400 ]; then
    print_warning "Low available memory. Consider stopping unnecessary services."
    print_micro_tip "Run: sudo systemctl stop snapd unattended-upgrades"
fi



# Set swap usage to be more aggressive (good for t3.micro)
echo 'vm.swappiness=60' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=60

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Optimize Docker for t3.micro
print_status "Optimizing Docker daemon for t3.micro..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
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

sudo systemctl restart docker
sleep 5

# Check environment file
if [ ! -f .env.production ]; then
    print_warning ".env.production file not found."
    
    # Check if we're in CI/CD (GitHub Actions will create this)
    if [ -n "$GITHUB_ACTIONS" ]; then
        print_error "GitHub Actions should have created .env.production file"
        exit 1
    fi
    
    print_status "Creating .env.production from your existing configuration..."
    
    # Copy and merge existing .env files
    if [ -f BackEnd/.env ] && [ -f frontend/.env ]; then
        print_status "Merging existing .env files..."
        
        # Create production env from existing files
        cat > .env.production << 'EOF'
# Production Environment Configuration
# Merged from your existing .env files

EOF
        
        # Add backend variables
        echo "# ============================================" >> .env.production
        echo "# BACKEND ENVIRONMENT VARIABLES" >> .env.production
        echo "# ============================================" >> .env.production
        echo "" >> .env.production
        cat BackEnd/.env >> .env.production
        echo "" >> .env.production
        
        # Add frontend variables
        echo "# ============================================" >> .env.production
        echo "# FRONTEND ENVIRONMENT VARIABLES" >> .env.production
        echo "# ============================================" >> .env.production
        echo "" >> .env.production
        cat frontend/.env >> .env.production
        
        # Add missing production variables
        echo "" >> .env.production
        echo "# Production Configuration" >> .env.production
        echo "NODE_ENV=production" >> .env.production
        echo "" >> .env.production
        echo "# t3.micro Memory Optimizations" >> .env.production
        echo "NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size" >> .env.production
        echo "" >> .env.production
        echo "# Security (CHANGE THESE IN PRODUCTION!)" >> .env.production
        echo "JWT_SECRET=your_jwt_secret_here_minimum_32_characters_long_change_this" >> .env.production
        echo "SESSION_SECRET=your_session_secret_here_minimum_32_characters_change_this" >> .env.production
        
        print_status "✅ Created .env.production from existing files"
    else
        print_error "BackEnd/.env or frontend/.env not found."
        print_error "Please create .env.production manually or copy from .env.example"
        print_error "cp .env.example .env.production && nano .env.production"
        exit 1
    fi
    
    print_warning "Please review .env.production file before continuing."
    print_warning "Especially change JWT_SECRET and SESSION_SECRET!"
    print_warning "Press Enter to continue after reviewing the file..."
    read
fi

# Check if service account key exists for Google Cloud
if [ ! -f "BackEnd/service-account-key.json" ]; then
    print_warning "Google Cloud service account key not found at BackEnd/service-account-key.json"
    
    # Check if it exists in current directory (from CI/CD)
    if [ -f "service-account-key.json" ]; then
        print_status "Found service account key in current directory, copying to BackEnd/"
        cp service-account-key.json BackEnd/service-account-key.json
        chmod 600 BackEnd/service-account-key.json
    else
        print_warning "This is required for Vertex AI functionality."
        print_warning "For manual deployment: Place your service-account-key.json in BackEnd/ directory"
        print_warning "For GitHub Actions: Add GOOGLE_SERVICE_ACCOUNT_KEY secret (base64 encoded)"
        print_warning "Press Enter to continue without it, or Ctrl+C to stop and add the file..."
        read
    fi
fi

# Validate environment by sourcing the production file
print_status "Validating production environment configuration..."
set -a  # Export all variables
source .env.production
set +a

# Validate critical variables
critical_vars=("MONGO_URI" "PORT")
missing_vars=()
optional_vars=("GEMINI_API_KEY" "FIREBASE_PROJECT_ID" "STRIPE_SECRET_KEY")

for var in "${critical_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing critical environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    print_error "Please check your .env.production file"
    exit 1
fi

# Check optional variables and warn if missing
for var in "${optional_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_warning "Optional variable $var is not set - some features may not work"
    fi
done

# Pre-deployment cleanup for t3.micro
print_status "Cleaning up to free memory..."
docker system prune -f
docker volume prune -f

# Free up system memory
sudo sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null

# Check available memory before deployment
AVAILABLE_BEFORE=$(free -m | awk 'NR==2{print $7}')
print_status "Available memory before deployment: ${AVAILABLE_BEFORE}MB"

if [ "$AVAILABLE_BEFORE" -lt 300 ]; then
    print_error "Insufficient memory for deployment. Available: ${AVAILABLE_BEFORE}MB, Required: 300MB+"
    print_micro_tip "Try stopping unnecessary services or rebooting the instance"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.micro.yml --env-file .env.production down 2>/dev/null || true

# Build images one by one to avoid memory pressure
print_status "Building images sequentially for t3.micro..."

print_status "Building backend image..."
docker build -f BackEnd/Dockerfile.prod -t jeewaka-backend ./BackEnd

# Free memory between builds
docker system prune -f
echo 1 | sudo tee /proc/sys/vm/drop_caches > /dev/null

print_status "Building frontend image..."
docker build -f frontend/Dockerfile.prod -t jeewaka-frontend ./frontend

# Final cleanup before starting services
docker system prune -f

# Start services with staggered startup for t3.micro
print_status "Starting services with staggered startup..."

# Start backend first (no database now, using MongoDB Atlas)
print_status "Starting backend service..."
docker-compose -f docker-compose.micro.yml --env-file .env.production up -d backend
sleep 45

# Check backend health before starting frontend
print_status "Checking backend health..."
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f --max-time 10 http://localhost:5000/health > /dev/null 2>&1; then
        print_status "✅ Backend is responding"
        break
    else
        print_warning "Backend not ready yet, attempt $attempt/$max_attempts..."
        sleep 15
        ((attempt++))
    fi
done

# Start frontend
print_status "Starting frontend service..."
docker-compose -f docker-compose.micro.yml --env-file .env.production up -d web

# Wait for services to stabilize
print_status "Waiting for services to stabilize (60 seconds)..."
sleep 60

# Health checks
print_status "Performing health checks..."

# Check memory usage after deployment
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep -E "(backend|web|db)")
print_status "Memory usage by containers:"
echo "$MEMORY_USAGE"

# Check backend health
if curl -f --max-time 10 http://localhost:5000/health > /dev/null 2>&1; then
    print_status "✅ Backend service is healthy"
else
    print_warning "⚠️ Backend health check failed - checking logs..."
    docker-compose -f docker-compose.micro.yml logs --tail=10 backend
fi

# Check frontend
if curl -f --max-time 10 http://localhost:80 > /dev/null 2>&1; then
    print_status "✅ Frontend service is healthy"
else
    print_warning "⚠️ Frontend health check failed - checking logs..."
    docker-compose -f docker-compose.micro.yml logs --tail=10 web
fi

# System resource monitoring
FINAL_MEM=$(free -m | awk 'NR==2{print $7}')
print_status "Final available memory: ${FINAL_MEM}MB"

if [ "$FINAL_MEM" -lt 100 ]; then
    print_warning "Very low memory remaining. Monitor system closely."
fi

# Create monitoring script for t3.micro
cat > monitor-micro.sh << 'EOF'
#!/bin/bash
echo "📊 t3.micro System Monitoring"
echo "================================"
echo "Memory Usage:"
free -h
echo ""
echo "Docker Container Stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "System Load:"
uptime
echo ""
echo "Top Memory Processes:"
ps aux --sort=-%mem | head -6
EOF
chmod +x monitor-micro.sh

# Create restart script for t3.micro issues
cat > restart-services.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting services for t3.micro..."

# Stop all services
docker-compose -f docker-compose.micro.yml --env-file .env.production down

# Clean up memory
docker system prune -f
sudo sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null

# Wait a bit
sleep 10

# Start services with delays
docker-compose -f docker-compose.micro.yml --env-file .env.production up -d backend
sleep 30
docker-compose -f docker-compose.micro.yml --env-file .env.production up -d web

echo "✅ Services restarted"
EOF
chmod +x restart-services.sh

print_status "🎉 t3.micro deployment completed!"
print_status ""
print_status "📊 Your Jeewaka Medical Platform is running at:"
print_status "   Frontend: http://$(curl -s ifconfig.me || echo 'your-ec2-ip'):80"
print_status "   Backend API: http://$(curl -s ifconfig.me || echo 'your-ec2-ip'):5000"
print_status ""
print_status "🛠️ t3.micro Management Commands:"
print_status "   Monitor system: ./monitor-micro.sh"
print_status "   Restart services: ./restart-services.sh"
print_status "   View logs: docker-compose -f docker-compose.micro.yml --env-file .env.production logs -f"
print_status "   Stop services: docker-compose -f docker-compose.micro.yml --env-file .env.production down"
print_status ""
print_status "📁 Environment Configuration:"
print_status "   Production config: .env.production"
print_status "   Backend config: BackEnd/.env"
print_status "   Frontend config: frontend/.env"
print_status ""
print_micro_tip "Monitor memory usage regularly with ./monitor-micro.sh"
print_micro_tip "If services become unresponsive, run ./restart-services.sh"
print_micro_tip "Environment variables are loaded from .env.production"

# Final system check
./monitor-micro.sh