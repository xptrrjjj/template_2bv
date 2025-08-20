# 🚀 Docker Deployment Guide
## SimplyAutomate Recruiter App - Production Deployment

This guide will help you deploy the SimplyAutomate Recruiter application using Docker with nginx-proxy and Let's Encrypt SSL certificates.

---

## 📋 Prerequisites

### Required Software
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **nginx-proxy** with **acme-companion** (for SSL)

### Required Services
- **Microsoft Azure AD** application registration
- **API Backend** (your datastore service)
- **Redis** (included in docker-compose)

### Optional Services
- **OpenAI API** account
- **Google Gemini API** account
- **TestDome API** account
- **TeamTailor API** account

---

## 🔧 Pre-Deployment Setup

### 1. nginx-proxy Setup
First, ensure you have nginx-proxy running with Let's Encrypt support:

```bash
# Create the nginx-proxy network
docker network create nginx-proxy

# Start nginx-proxy with Let's Encrypt companion
# (Use the official nginx-proxy + acme-companion setup)
```

If you don't have nginx-proxy set up, follow the official guide:
- [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy)
- [acme-companion](https://github.com/nginx-proxy/acme-companion)

### 2. DNS Configuration
Ensure your domain `recruiter-f.rnd.2bv.io` points to your server's IP address:

```bash
# Check DNS resolution
nslookup recruiter-f.rnd.2bv.io
dig recruiter-f.rnd.2bv.io
```

### 3. Azure AD Application Registration
Register your application in Azure AD:

1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Set **Redirect URI**: `https://recruiter-f.rnd.2bv.io/auth/callback`
4. Note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**

---

## ⚙️ Configuration

### 1. Environment Configuration
Copy the production environment template:

```bash
cp .env.production .env.local
```

### 2. Production Configuration
The production configuration is already set up in `.env.production` (tracked in git). 
For local development, copy the example:

```bash
# For local development only
cp .env.example .env.local
nano .env.local  # Configure with your development values
```

**Note**: The deployment script will automatically use `.env.production` for production deployment.

**Required Configuration:**
```env
# Microsoft Azure AD (REQUIRED)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_TENANT_ID=your-azure-tenant-id-here

# API Configuration (REQUIRED)
API_BASE_URL=https://api.your-datastore.com
API_SECRET_KEY=your-api-secret-key-here

# Security (REQUIRED)
NEXTAUTH_SECRET=your-nextauth-secret-here-minimum-32-characters-long

# Redis (REQUIRED)
REDIS_PASSWORD=your-redis-password-here

# Datastore (REQUIRED)
DATASTORE_API_URL=https://api.your-datastore.com
DATASTORE_API_KEY=your-datastore-api-key-here
```

**Optional Configuration:**
```env
# AI Services (OPTIONAL but recommended)
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# External Integrations (OPTIONAL)
TESTDOME_API_KEY=your-testdome-api-key-here
TEAMTAILOR_API_KEY=your-teamtailor-api-key-here

# Monitoring (OPTIONAL)
SENTRY_DSN=your-sentry-dsn-here
GOOGLE_ANALYTICS_ID=your-ga-id-here
```

### 3. Generate NEXTAUTH_SECRET
Generate a secure secret for NextAuth:

```bash
# Generate a random 32-character string
openssl rand -base64 32
```

---

## 🚀 Deployment

### Option 1: Automated Deployment (Recommended)
Use the provided deployment script:

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production
```

The script will:
- ✅ Validate environment variables
- ✅ Check prerequisites
- ✅ Build and start containers
- ✅ Perform health checks
- ✅ Display deployment status

### Option 2: Manual Deployment
If you prefer manual deployment:

```bash
# Create necessary directories
mkdir -p logs uploads
chmod 755 logs uploads

# Stop any existing containers
docker-compose down --remove-orphans

# Build and start the application
docker-compose up -d --build

# Check container status
docker-compose ps

# View logs
docker-compose logs -f recruiter-app
```

---

## 🔍 Verification

### 1. Container Status Check
```bash
# Check if containers are running
docker-compose ps

# Expected output:
# Name                Command               State           Ports
# ----------------------------------------------------------------
# recruiter-f-2bv    docker-entrypoint.sh node ...   Up      3000/tcp
# recruiter-redis    docker-entrypoint.sh redis ...  Up      6379/tcp
```

### 2. Health Check
```bash
# Local health check
curl -f http://localhost:3000/api/health

# Public health check
curl -f https://recruiter-f.rnd.2bv.io/api/health
```

### 3. SSL Certificate Check
```bash
# Check SSL certificate
openssl s_client -connect recruiter-f.rnd.2bv.io:443 -servername recruiter-f.rnd.2bv.io
```

### 4. Application Access
Visit: **https://recruiter-f.rnd.2bv.io**

Expected behavior:
- ✅ Redirects to Microsoft login
- ✅ After login, shows the application dashboard
- ✅ SSL certificate is valid (Let's Encrypt)

---

## 📊 Monitoring & Maintenance

### Container Management
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f recruiter-app
docker-compose logs -f redis

# Restart services
docker-compose restart recruiter-app
docker-compose restart redis

# Stop all services
docker-compose down

# Update application (rebuild and restart)
docker-compose up -d --build recruiter-app
```

### Health Monitoring
```bash
# Check application health
curl -s https://recruiter-f.rnd.2bv.io/api/health | jq .

# Monitor container resources
docker stats recruiter-f-2bv
```

### Log Management
```bash
# View application logs
tail -f logs/app.log

# Rotate logs (setup logrotate)
sudo nano /etc/logrotate.d/recruiter-app
```

### Backup Procedures
```bash
# Backup Redis data
docker exec recruiter-redis redis-cli BGSAVE

# Backup application data (if applicable)
docker exec recruiter-f-2bv npm run backup
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check container logs
docker-compose logs recruiter-app

# Check system resources
df -h
free -h
docker system df
```

#### 2. SSL Certificate Issues
```bash
# Check nginx-proxy logs
docker logs nginx-proxy
docker logs nginx-proxy-acme

# Manually trigger certificate renewal
docker exec nginx-proxy-acme /app/force-renew recruiter-f.rnd.2bv.io
```

#### 3. Database Connection Issues
```bash
# Test API connectivity
curl -v https://api.your-datastore.com

# Check environment variables
docker exec recruiter-f-2bv env | grep API
```

#### 4. Azure AD Authentication Issues
- Verify **Redirect URI** in Azure AD matches: `https://recruiter-f.rnd.2bv.io/auth/callback`
- Check **Client ID** and **Tenant ID** are correct
- Ensure **NEXTAUTH_URL** matches your domain

#### 5. Memory Issues
```bash
# Check memory usage
docker stats --no-stream

# Increase memory limits in docker-compose.yml
services:
  recruiter-app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Performance Tuning
```bash
# Optimize Docker images
docker system prune -a

# Monitor performance
docker exec recruiter-f-2bv top
```

---

## 🔄 Updates & Rollbacks

### Application Updates
```bash
# Pull latest code
git pull origin main

# Deploy updates
./deploy.sh production
```

### Rollback Procedure
```bash
# Stop current version
docker-compose down

# Switch to previous git commit
git checkout <previous-commit>

# Deploy previous version
./deploy.sh production
```

---

## 📋 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AZURE_CLIENT_ID` | ✅ | Azure AD Client ID | `12345678-1234-1234-1234-123456789012` |
| `AZURE_TENANT_ID` | ✅ | Azure AD Tenant ID | `87654321-4321-4321-4321-210987654321` |
| `API_BASE_URL` | ✅ | Backend API URL | `https://api.example.com` |
| `NEXTAUTH_SECRET` | ✅ | NextAuth secret key | `32-character-random-string` |
| `REDIS_PASSWORD` | ✅ | Redis password | `secure-redis-password` |
| `OPENAI_API_KEY` | ⚠️ | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | ⚠️ | Gemini API key | `AI...` |
| `TESTDOME_API_KEY` | ⚠️ | TestDome API key | `td_...` |
| `TEAMTAILOR_API_KEY` | ⚠️ | TeamTailor API key | `tt_...` |

**Legend:**
- ✅ Required for basic functionality
- ⚠️ Optional but recommended for full features

---

## 🛡️ Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Network Security
- nginx-proxy handles SSL termination
- Application runs on internal Docker network
- Redis is not exposed externally

### 3. Application Security
- Content Security Policy headers configured
- XSS protection enabled
- CSRF protection via NextAuth

### 4. Access Control
- RBAC system controls user permissions
- Azure AD provides enterprise authentication
- API endpoints require valid tokens

---

## 📞 Support

If you encounter issues:

1. **Check logs**: `docker-compose logs -f`
2. **Verify health**: `curl https://recruiter-f.rnd.2bv.io/api/health`
3. **Review configuration**: Ensure all required environment variables are set
4. **Check external services**: Verify API endpoints and authentication
5. **Consult documentation**: See `COMPLETE_APP_DOCUMENTATION.md`

---

## 🎉 Deployment Complete!

Your SimplyAutomate Recruiter application is now running at:
**https://recruiter-f.rnd.2bv.io**

The application includes:
- ✅ SSL certificate via Let's Encrypt
- ✅ Microsoft Azure AD authentication
- ✅ Redis caching
- ✅ Health monitoring
- ✅ Automatic restarts
- ✅ Log management