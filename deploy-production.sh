#!/bin/bash

# Production Deployment Script for Jeewaka Medical Platform
# This script automates the deployment process on EC2

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo apt install -y docker.io docker-compose
    sudo usermod -aG docker ubuntu
    echo "⚠️  Please log out and log back in for Docker permissions to take effect"
fi

# Clone or update repository
if [ ! -d "Jeewaka-Medical-Platform" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/Jeewaka-MediCare/Jeewaka-Medical-Platform.git
    cd Jeewaka-Medical-Platform
else
    echo "🔄 Updating repository..."
    cd Jeewaka-Medical-Platform
    git pull origin main
fi

# Check if required files exist
echo "🔍 Checking required files..."
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please copy your .env.production file to this directory"
    exit 1
fi

if [ ! -f "BackEnd/service-account-key.json" ]; then
    echo "❌ service-account-key.json not found!"
    echo "Please copy your Google Cloud service account key to BackEnd/service-account-key.json"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.micro.yml down || true

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.micro.yml up --build -d

# Wait for containers to be healthy
echo "⏳ Waiting for containers to start..."
sleep 30

# Check container status
echo "🔍 Checking container status..."
docker-compose -f docker-compose.micro.yml ps

# Test API endpoints
echo "🧪 Testing API endpoints..."
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Backend API is running"
else
    echo "❌ Backend API is not responding"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
fi

echo "🎉 Deployment completed!"
echo ""
echo "Your application is now running:"
echo "🌐 Frontend: http://$(curl -s ifconfig.me)"
echo "🔌 Backend API: http://$(curl -s ifconfig.me):5000"
echo ""
echo "To view logs:"
echo "docker-compose -f docker-compose.micro.yml logs -f"