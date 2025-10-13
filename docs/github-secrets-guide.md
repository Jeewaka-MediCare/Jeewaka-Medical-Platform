# 🔐 GitHub Secrets Management for Production Deployment

## 📋 **Required GitHub Secrets**

### **1. Set up GitHub Repository Secrets**

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

```bash
# EC2 Deployment Secrets
EC2_SSH_PRIVATE_KEY          # Your EC2 private key content
EC2_HOSTNAME                 # Your EC2 public IP or domain
EC2_USER_NAME               # ubuntu (for Ubuntu EC2)

# Database Secrets
MONGO_URI                   # Your MongoDB Atlas connection string
JWT_SECRET                  # 32+ character random string
SESSION_SECRET              # 32+ character random string

# Google Cloud Secrets
GEMINI_API_KEY             # Your Gemini API key
GOOGLE_CLOUD_PROJECT_ID    # Your Google Cloud project ID
GOOGLE_SERVICE_ACCOUNT_KEY # Your entire service-account-key.json content (base64 encoded)

# Firebase Secrets
FIREBASE_PROJECT_ID        # Your Firebase project ID
FIREBASE_CLIENT_EMAIL      # Firebase service account email
FIREBASE_PRIVATE_KEY       # Firebase private key (with \n preserved)

# Stripe Secrets
STRIPE_SECRET_KEY          # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY     # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET      # Your Stripe webhook secret

# Supabase Secrets
SUPABASE_URL               # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY  # Your Supabase service role key
SUPABASE_MEDICAL_RECORDS_BUCKET # Your Supabase bucket name

# Frontend Secrets
VITE_STRIPE_PUBLISHABLE_KEY # Your frontend Stripe key

# Notification (Optional)
SLACK_WEBHOOK_URL          # For deployment notifications
```

## 🔧 **How Secrets Are Injected**

### **Method 1: GitHub Actions (Recommended)**

```yaml
# .github/workflows/deploy.yml
- name: Deploy to EC2
  env:
    # All secrets from GitHub repository secrets
    MONGO_URI: ${{ secrets.MONGO_URI }}
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
    # ... etc
  run: |
    # Create .env.production on EC2 from secrets
    echo "MONGO_URI=${MONGO_URI}" > .env.production
    echo "GEMINI_API_KEY=${GEMINI_API_KEY}" >> .env.production
    # ... etc
```

### **Method 2: Manual EC2 Deployment**

```bash
# On your EC2 instance, create .env.production manually
nano .env.production

# Add your actual values:
MONGO_URI=mongodb+srv://gt202054194:Vihanga516@cluster0.wjunv6a.mongodb.net/medAI?retryWrites=true&w=majority&appName=Cluster0
GEMINI_API_KEY=AIzaSyD1ucMgz9MLnVWDIjlNiIfpKb9HQt7BPYs
# ... etc
```

## 📁 **File Structure for Secrets**

```
📁 Your Repository (GitHub)
├── 📄 .env.example               # Template with fake values
├── 📄 .gitignore                # Ignores real .env files
├── 📄 docker-compose.micro.yml   # References environment variables
├── 📁 .github/workflows/
│   └── 📄 deploy.yml            # Uses GitHub secrets
└── 📁 scripts/
    └── 📄 deploy-micro.sh       # Creates .env.production from secrets

📁 EC2 Instance (Production)
├── 📄 .env.production           # Created during deployment
├── 📄 service-account-key.json  # Created from GitHub secret
└── 📁 BackEnd/
    └── 📄 service-account-key.json # Symlink or copy
```