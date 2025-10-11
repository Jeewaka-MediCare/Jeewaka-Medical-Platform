# 🔐 Complete Secrets Management Setup Guide

## 🎯 **Two Deployment Methods**

### **Method 1: GitHub Actions (Automated) - RECOMMENDED**

#### **Step 1: Set up GitHub Repository Secrets**

1. Go to your GitHub repository: `https://github.com/Jeewaka-MediCare/Jeewaka-Medical-Platform`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

```bash
# EC2 Access
EC2_SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
(your entire EC2 private key content)
-----END RSA PRIVATE KEY-----

EC2_HOSTNAME=your-ec2-public-ip-or-domain.com
EC2_USER_NAME=ubuntu

# Your MongoDB Atlas connection
MONGO_URI=mongodb+srv://gt202054194:Vihanga516@cluster0.wjunv6a.mongodb.net/medAI?retryWrites=true&w=majority&appName=Cluster0

# Generate secure random strings (32+ characters)
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
SESSION_SECRET=your_secure_session_secret_32_chars_minimum

# Your Google Cloud credentials
GEMINI_API_KEY=AIzaSyD1ucMgz9MLnVWDIjlNiIfpKb9HQt7BPYs
GOOGLE_CLOUD_PROJECT_ID=calcium-chalice-466720-p1

# Base64 encode your service-account-key.json file
GOOGLE_SERVICE_ACCOUNT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (base64 encoded)

# Your Firebase configuration
FIREBASE_PROJECT_ID=medai-f6b21
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@medai-f6b21.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
(your Firebase private key with \n preserved)
-----END PRIVATE KEY-----

# Your Stripe keys
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Your Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_MEDICAL_RECORDS_BUCKET=medical-records
ENABLE_SUPABASE_BACKUP=true

# Your frontend Stripe key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S0zCgD3q2KwZfFnSj8Xf1cidCYG19y1ircVKuiOcCqagqSEioq2D1su9lvN6HpKoQnpY8gzgjaF4XJuuVnlPuor00dB2S7xTs
```

#### **Step 2: Prepare service-account-key.json for GitHub**

```bash
# On your local machine, encode your service account key:
base64 -i BackEnd/service-account-key.json

# Copy the output and add it as GOOGLE_SERVICE_ACCOUNT_KEY secret in GitHub
```

#### **Step 3: Deploy via GitHub Actions**

```bash
# Push any changes to main branch
git add .
git commit -m "Add deployment configuration"
git push origin main

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build Docker images
# 3. Create .env.production with secrets
# 4. Deploy to your EC2 instance
```

---

### **Method 2: Manual EC2 Deployment**

#### **Step 1: Connect to EC2**

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /opt/jeewaka-medical-platform
```

#### **Step 2: Create Environment File**

```bash
# Option A: Copy from template
cp .env.example .env.production
nano .env.production
# Fill in all your actual values

# Option B: Auto-merge existing files (if you have them locally)
# Upload your BackEnd/.env and frontend/.env first, then:
./scripts/deploy-micro.sh  # Will auto-create .env.production
```

#### **Step 3: Add Service Account Key**

```bash
# Upload your service-account-key.json to EC2
scp -i your-key.pem BackEnd/service-account-key.json ubuntu@your-ec2-ip:/opt/jeewaka-medical-platform/BackEnd/

# Or create it directly on EC2:
nano BackEnd/service-account-key.json
# Paste your JSON content
chmod 600 BackEnd/service-account-key.json
```

#### **Step 4: Deploy**

```bash
chmod +x scripts/deploy-micro.sh
./scripts/deploy-micro.sh
```

---

## 🔄 **How the Service Account Key is Mounted**

### **File Flow:**

```
Development:
D:\Jeewaka-Medical-Platform\BackEnd\service-account-key.json
                     ↓
                (Not committed to GitHub)
                     ↓
GitHub Secret: GOOGLE_SERVICE_ACCOUNT_KEY (base64 encoded)
                     ↓
GitHub Actions: Decodes and creates file on EC2
                     ↓
EC2: /opt/jeewaka-medical-platform/BackEnd/service-account-key.json
                     ↓
Docker Volume Mount: ./BackEnd/service-account-key.json:/app/service-account-key.json:ro
                     ↓
Container: /app/service-account-key.json
                     ↓
Environment Variable: GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
```

### **Docker Volume Mount:**

```yaml
# In docker-compose.micro.yml
volumes:
  # Mount service account key for Google Cloud
  - ./BackEnd/service-account-key.json:/app/service-account-key.json:ro
```

**Breakdown:**
- `./BackEnd/service-account-key.json` = Host file (on EC2)
- `/app/service-account-key.json` = Container file path
- `:ro` = Read-only mount

### **Environment Variable:**

```bash
# In container environment
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
```

This tells the Google Cloud SDK where to find the credentials inside the container.

---

## 🔍 **Verification Commands**

### **Check Secrets in GitHub Actions:**

```yaml
# In your workflow, add a debug step:
- name: Debug Environment
  run: |
    echo "MONGO_URI is set: $([[ -n "$MONGO_URI" ]] && echo "YES" || echo "NO")"
    echo "Service account key length: ${#GOOGLE_SERVICE_ACCOUNT_KEY}"
```

### **Check Files on EC2:**

```bash
# Check if files exist
ls -la /opt/jeewaka-medical-platform/.env.production
ls -la /opt/jeewaka-medical-platform/BackEnd/service-account-key.json

# Check file permissions
stat /opt/jeewaka-medical-platform/BackEnd/service-account-key.json

# Verify environment variables in container
docker exec jeewaka-backend env | grep -E "(MONGO_URI|GOOGLE_APPLICATION_CREDENTIALS)"

# Check if service account key is mounted correctly
docker exec jeewaka-backend ls -la /app/service-account-key.json
```

---

## 🚨 **Security Best Practices**

### **✅ DO:**
- Use GitHub repository secrets for sensitive data
- Base64 encode binary files for GitHub secrets
- Set restrictive file permissions (600) on key files
- Use read-only mounts for credential files
- Regularly rotate API keys and secrets

### **❌ DON'T:**
- Commit .env files with real secrets to Git
- Put service account keys in the repository
- Use weak JWT secrets (use 32+ random characters)
- Share secrets in chat/email
- Use production keys in development

---

## 🎯 **Quick Troubleshooting**

### **If GitHub Actions Fails:**
```bash
# Check GitHub Actions logs for:
# 1. Missing secrets
# 2. Base64 decoding errors
# 3. SSH connection issues
# 4. File permission problems
```

### **If Manual Deployment Fails:**
```bash
# Check environment file
cat .env.production | head -10

# Check service account key
file BackEnd/service-account-key.json

# Check Docker container environment
docker exec jeewaka-backend printenv | grep GOOGLE
```

Your secrets are now properly managed and injected securely! 🔐