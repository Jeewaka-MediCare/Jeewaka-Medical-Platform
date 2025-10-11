# 🚀 t3.micro Deployment Guide for Jeewaka Medical Platform

## 💰 Cost Breakdown (t3.micro)
- **EC2 Instance**: $8.50/month (or FREE for first 750 hours/month for 12 months)
- **EBS Storage**: $2-3/month (20GB)
- **Data Transfer**: $0-5/month (first 1GB free)
- **Total**: ~$10-15/month (or ~$5/month with free tier)

## ⚡ t3.micro Specifications
- **Memory**: 1 GB RAM
- **vCPUs**: 2 (burstable performance)
- **Network**: Up to 5 Gbps
- **CPU Credits**: Baseline 20% performance with burst capability

## 🎯 Optimizations for 1GB RAM

### Memory Distribution Strategy:
```
Total 1GB RAM:
├── System (Ubuntu): ~200MB
├── Docker Daemon: ~100MB
├── MongoDB: ~250MB (optimized)
├── Backend (Node.js): ~300MB
├── Frontend (Nginx): ~100MB
└── Buffer/Cache: ~50MB
```

## 📋 Step-by-Step Deployment

### Step 1: Launch EC2 t3.micro Instance

#### AWS Console Setup:
1. **Instance Type**: t3.micro
2. **AMI**: Ubuntu Server 22.04 LTS
3. **Storage**: 20GB gp3 (3,000 IOPS)
4. **Security Group**: 
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom (5000) - 0.0.0.0/0 (API)

#### Key Security Group Rules:
```bash
# SSH access (replace with your IP)
ssh -i your-key.pem ubuntu@your-ec2-ip

# Security group configuration
Type        Protocol    Port Range    Source
SSH         TCP         22           Your.IP.Address/32
HTTP        TCP         80           0.0.0.0/0
HTTPS       TCP         443          0.0.0.0/0
Custom TCP  TCP         5000         0.0.0.0/0
```

### Step 2: Initial Server Setup

```bash
# Connect to your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Download and run setup script
wget https://raw.githubusercontent.com/your-username/Jeewaka-Medical-Platform/main/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh

# Reboot to apply all changes
sudo reboot
```

### Step 3: Clone and Configure

```bash
# Reconnect after reboot
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Clone repository
cd /opt/jeewaka-medical-platform
git clone https://github.com/Jeewaka-MediCare/Jeewaka-Medical-Platform.git .

# Configure environment
cp .env.template .env
nano .env  # Edit with your actual values
```

### Step 4: Deploy Application

```bash
# Make deployment script executable
chmod +x scripts/deploy-micro.sh

# Deploy (this will take 10-15 minutes on t3.micro)
./scripts/deploy-micro.sh
```

## 🔧 t3.micro Specific Configurations

### Memory-Optimized Environment Variables:
```bash
# In your .env file
NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size
MONGODB_CACHE_SIZE=128
BCRYPT_ROUNDS=10  # Reduced for faster processing
SESSION_MAX_AGE=3600000  # 1 hour sessions
DISABLE_ANALYTICS=true
DISABLE_TELEMETRY=true
```

### MongoDB Configuration (t3.micro):
```bash
# Optimized MongoDB settings
mongod --wiredTigerCacheSizeGB 0.15 --quiet --logpath /dev/null
```

### Docker Resource Limits:
```yaml
# docker-compose.micro.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 400M
        reservations:
          memory: 200M
```

## 📊 Monitoring and Maintenance

### Essential Monitoring Commands:
```bash
# System health check
./system-check.sh

# Monitor Docker containers
docker stats --no-stream

# Check memory usage
free -h

# Monitor system load
htop

# View application logs
docker-compose -f docker-compose.micro.yml logs -f
```

### Performance Optimization:
```bash
# Free memory cache (run when sluggish)
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Restart services if memory issues
./restart-services.sh

# Clean up Docker (weekly)
docker system prune -f
```

## ⚠️ t3.micro Limitations and Solutions

### Common Issues:

#### 1. **High Memory Usage**
```bash
# Symptoms: Application becomes slow or unresponsive
# Solution: Restart services
./restart-services.sh

# Permanent fix: Optimize code or upgrade to t3.small
```

#### 2. **CPU Credit Depletion**
```bash
# Check CPU credits
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUCreditBalance \
  --dimensions Name=InstanceId,Value=i-your-instance-id \
  --start-time 2025-10-09T00:00:00Z \
  --end-time 2025-10-10T00:00:00Z \
  --period 3600 \
  --statistics Average

# Solution: Optimize Docker builds, use lighter base images
```

#### 3. **Disk Space Issues**
```bash
# Check disk usage
df -h

# Clean up logs and Docker
sudo docker system prune -a -f
sudo journalctl --vacuum-time=3d
```

## 🚀 Performance Tuning

### Database Optimization:
```javascript
// In your backend, use lean queries
const sessions = await Session.find().lean();

// Use projection to limit data
const users = await User.find({}, 'name email').lean();

// Add indexes for frequently queried fields
db.sessions.createIndex({ doctorId: 1, date: 1 });
```

### Frontend Optimization:
```javascript
// Use React.memo for expensive components
const SessionCard = React.memo(({ session }) => {
  // Component logic
});

// Implement pagination
const ITEMS_PER_PAGE = 10;  // Reduce from 50 to save memory
```

## 📈 Scaling Indicators

### When to Upgrade from t3.micro:

#### Upgrade to t3.small ($16/month) if:
- ✅ Memory usage consistently > 80%
- ✅ Application becomes unresponsive frequently
- ✅ More than 10 concurrent users
- ✅ Need faster build/deployment times

#### Upgrade to t3.medium ($33/month) if:
- ✅ More than 50 concurrent users
- ✅ Complex queries taking > 5 seconds
- ✅ Need multiple environments (staging + prod)
- ✅ File uploads and processing required

## 🔐 Security Considerations

### t3.micro Security Hardening:
```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Set up fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Use key-based SSH only
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
```

## 📋 Deployment Checklist

### Pre-Deployment:
- [ ] EC2 instance launched and accessible
- [ ] Security groups configured
- [ ] SSH key pair working
- [ ] Domain name configured (optional)

### Setup Phase:
- [ ] ec2-setup.sh executed successfully
- [ ] Instance rebooted
- [ ] System health check passed
- [ ] Swap space configured

### Configuration Phase:
- [ ] Repository cloned
- [ ] .env file configured
- [ ] Environment variables validated
- [ ] Secrets properly secured

### Deployment Phase:
- [ ] deploy-micro.sh executed
- [ ] All containers running
- [ ] Health checks passing
- [ ] Application accessible

### Post-Deployment:
- [ ] SSL certificate installed (if domain)
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Performance baseline established

## 🆘 Troubleshooting

### Common Solutions:
```bash
# If deployment fails due to memory
sudo systemctl stop snapd unattended-upgrades
docker system prune -f
./deploy-micro.sh

# If containers keep restarting
docker-compose -f docker-compose.micro.yml logs backend
# Check for memory limits in logs

# If database connection fails
docker-compose -f docker-compose.micro.yml restart db
sleep 30
docker-compose -f docker-compose.micro.yml restart backend
```

---

## 📞 Support

For t3.micro specific issues:
1. Check system resources: `./system-check.sh`
2. Review container logs: `docker-compose logs`
3. Monitor memory usage: `free -h`
4. Consider upgrading if consistently hitting limits

**Remember**: t3.micro is perfect for MVP and low-traffic applications. Monitor usage and be ready to scale up as your user base grows!