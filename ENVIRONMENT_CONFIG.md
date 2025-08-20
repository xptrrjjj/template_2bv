# Environment Configuration Guide

## 📋 Overview

This project uses a production-first environment configuration approach where production values are stored in git for deployment automation.

## 📁 File Structure

```
.env.production    # ✅ Production config (tracked in git)
.env.example      # ✅ Template for development (tracked in git)  
.env.local        # ❌ Local development (ignored by git)
.env              # ❌ Default (ignored by git)
```

## 🚀 For Production Deployment

### Automated Deployment
The production configuration is already set up in `.env.production` with your actual values:

- **Azure AD**: `beb94f6d-1c3e-4272-b128-0a6107aabe99`
- **API Endpoint**: `https://framework.2bv.io`
- **Domain**: `recruiter-f.rnd.2bv.io`
- **Super Admin**: `peter.esquilla@simplyautomate.ai`

Simply run:
```bash
./deploy.sh production
```

The script will automatically:
1. Use values from `.env.production`
2. Copy to `.env.local` for Docker Compose
3. Deploy with correct production configuration

## 💻 For Local Development

### Setup
```bash
# Copy template for local development
cp .env.example .env.local

# Edit with your local values
nano .env.local
```

### Local Development Values
For local development, use:
- **NEXT_PUBLIC_APP_URL**: `http://localhost:3000`
- **NEXT_PUBLIC_REDIRECT_URI**: `http://localhost:3000/auth/callback`
- **NODE_ENV**: `development`

## 🔑 Key Environment Variables

### Required Production Values (Already Configured)
- ✅ `AZURE_CLIENT_ID`: Microsoft Azure AD Client ID
- ✅ `AZURE_TENANT_ID`: Microsoft Azure AD Tenant ID  
- ✅ `NEXT_PUBLIC_API_BASE_URL`: API endpoint URL
- ✅ `OPENAI_API_KEY`: AI service key
- ✅ `TEAMTAILOR_API_KEY`: Job posting integration

### Values That May Need Updates
- `API_SECRET_KEY`: Your API authentication key
- `DATASTORE_API_KEY`: Your datastore access key
- `NEXTAUTH_SECRET`: Secure random string (32+ chars)

## 🛡️ Security Notes

### What's Safe in Git
- ✅ **Public keys/IDs**: Azure Client ID, API endpoints
- ✅ **Configuration flags**: Feature toggles, timeouts
- ✅ **User emails**: Admin user emails
- ✅ **Domain names**: Production URLs

### What Should Be Protected
- ❌ **API Secret Keys**: Server-to-server auth tokens
- ❌ **Private Keys**: JWT signing keys, encryption keys
- ❌ **Database passwords**: If using direct DB connections

### Current Status
- **Safe**: All current values in `.env.production` are safe to track in git
- **Keys**: API keys are for external services (OpenAI, TeamTailor, etc.)
- **IDs**: Azure AD Client IDs are public identifiers

## 🔄 Configuration Updates

### For Production Changes
1. Edit `.env.production` directly
2. Commit changes to git
3. Run deployment script

### For Local Development
1. Edit `.env.local` (not tracked in git)
2. Restart development server

## 📝 Docker Compose Integration

The `docker-compose.yml` file reads environment variables using:
```yaml
environment:
  - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
  - NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
  # ... other variables
```

The deployment script ensures the correct environment file is used.

## 🎯 Benefits of This Approach

1. **Automated Deployment**: No manual configuration needed
2. **Version Control**: Configuration changes are tracked
3. **Consistency**: Same config across deployments
4. **Security**: Appropriate separation of concerns
5. **Documentation**: Configuration is self-documenting

## ✅ Quick Reference

| Task | Command | File Used |
|------|---------|-----------|
| **Production Deploy** | `./deploy.sh` | `.env.production` |
| **Local Development** | `npm run dev` | `.env.local` |
| **Configuration Template** | - | `.env.example` |

## 🔧 Troubleshooting

### Environment Not Loading
```bash
# Check if production config exists
ls -la .env.production

# Verify values are set
source .env.production
echo $AZURE_CLIENT_ID
```

### Docker Compose Issues
```bash
# Verify environment variables
docker-compose config

# Check container environment
docker exec recruiter-f-2bv env | grep AZURE
```

### Missing Variables
```bash
# Compare with example
diff .env.example .env.production
```