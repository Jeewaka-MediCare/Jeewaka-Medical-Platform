# 🔧 Environment Configuration Guide - CORRECTED

## ✅ **Fixed Issues:**

### **1. Multiple Environment Files Structure**
```
📁 Project Root/
├── 📄 .env.production          # ← NEW: Combined production config
├── 📁 BackEnd/
│   └── 📄 .env                 # ← Your existing backend config
├── 📁 frontend/
│   └── 📄 .env                 # ← Your existing frontend config
└── 📁 scripts/
    └── 📄 deploy-micro.sh      # ← Updated to use .env.production
```

### **2. Environment Variable Mapping**

#### **Backend Variables (from your BackEnd/.env):**
```bash
# Database - Using your MongoDB Atlas
MONGO_URI=mongodb+srv://gt202054194:Vihanga516@cluster0.wjunv6a.mongodb.net/medAI?retryWrites=true&w=majority&appName=Cluster0

# Google Cloud/Vertex AI
GEMINI_API_KEY=AIzaSyD1ucMgz9MLnVWDIjlNiIfpKb9HQt7BPYs
GOOGLE_CLOUD_PROJECT_ID=calcium-chalice-466720-p1
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

# Firebase
FIREBASE_PROJECT_ID=medai-f6b21
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@medai-f6b21.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="..."  # Your long private key

# Stripe
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE

# Supabase
SUPABASE_URL=https://dftxedcmgxhqgeevaxmi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Frontend Variables (from your frontend/.env):**
```bash
# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S0zCgD3q2KwZfFnSj8Xf1cidCYG19y1ircVKuiOcCqagqSEioq2D1su9lvN6HpKoQnpY8gzgjaF4XJuuVnlPuor00dB2S7xTs

# API URLs (for production)
VITE_API_URL=http://backend:5000/api
VITE_BACKEND_URL=http://backend:5000
```

### **3. Docker Configuration Updates**

#### **✅ FIXED: docker-compose.micro.yml**
- Uses your actual MongoDB Atlas URI (no local database container)
- Correctly maps all environment variables
- Mounts service-account-key.json for Google Cloud
- Uses .env.production file

#### **✅ FIXED: Deployment Scripts**
- Automatically merges BackEnd/.env and frontend/.env
- Creates .env.production for Docker Compose
- Validates all critical variables
- Uses correct file paths

### **4. Memory Optimization for t3.micro**

#### **Resource Allocation (1GB RAM):**
```
System:     ~200MB
Backend:    ~400MB (Node.js + API)
Frontend:   ~200MB (Nginx + Static files)
Buffer:     ~200MB (Available for bursts)
Total:      1000MB ✅
```

#### **No Local Database:** Using MongoDB Atlas saves ~300MB RAM!

## 🚀 **Deployment Commands (Updated)**

### **Step 1: Environment Setup**
```bash
# The script will automatically merge your existing .env files
./scripts/deploy-micro.sh
```

### **Step 2: Manual Environment Check (Optional)**
```bash
# Check your current environment files
cat BackEnd/.env
cat frontend/.env

# Review the merged production file
cat .env.production
```

### **Step 3: Deploy with Correct Environment**
```bash
# Deploy using the corrected configuration
docker-compose -f docker-compose.micro.yml --env-file .env.production up -d
```

## 🔍 **Validation Commands**

### **Check Environment Variables in Containers:**
```bash
# Backend environment
docker exec jeewaka-backend env | grep -E "(MONGO_URI|GEMINI_API_KEY|FIREBASE)"

# Frontend build variables
docker exec jeewaka-frontend env | grep VITE
```

### **Check Service Health:**
```bash
# Backend API
curl http://localhost:5000/health

# Frontend
curl http://localhost:80
```

## ⚠️ **Important Notes**

### **Security Considerations:**
1. **🔐 Add these to .env.production:**
   ```bash
   JWT_SECRET=your_secure_32_character_secret_here
   SESSION_SECRET=your_secure_session_secret_here
   ```

2. **📁 File Permissions:**
   ```bash
   chmod 600 .env.production
   chmod 600 BackEnd/service-account-key.json
   ```

3. **🌐 Production URLs:** Update API URLs for your domain:
   ```bash
   VITE_API_URL=https://your-domain.com/api
   VITE_BACKEND_URL=https://your-domain.com
   ```

### **Database Configuration:**
- ✅ **Using MongoDB Atlas** (from your MONGO_URI)
- ✅ **No local database container** needed
- ✅ **Saves ~300MB RAM** on t3.micro

### **File Structure Requirements:**
```bash
# Required files for deployment:
BackEnd/service-account-key.json  # For Google Cloud
BackEnd/.env                      # Your existing backend config
frontend/.env                     # Your existing frontend config
```

## 🎯 **What's Changed Summary**

| **Before (Incorrect)** | **After (Fixed)** |
|------------------------|-------------------|
| Made-up environment variables | Your actual values from .env files |
| Local MongoDB container | MongoDB Atlas (saves memory) |
| Incorrect variable names | Correct mapping from your files |
| Single .env approach | Multi-file merge strategy |
| Generic secrets | Your actual API keys and secrets |

Your deployment is now properly configured to use your actual services:
- ✅ MongoDB Atlas database
- ✅ Google Cloud Vertex AI
- ✅ Firebase authentication
- ✅ Stripe payments
- ✅ Supabase storage

The memory optimization for t3.micro is much better now since we're not running a local database!