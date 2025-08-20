#!/bin/bash

# Deployment script for SimplyAutomate Recruiter App
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
APP_NAME="recruiter-f-2bv"
DOMAIN="recruiter-f.rnd.2bv.io"

echo "🚀 Starting deployment of SimplyAutomate Recruiter App"
echo "📊 Environment: $ENVIRONMENT"
echo "🌐 Domain: $DOMAIN"
echo "📦 Container: $APP_NAME"
echo "----------------------------------------"

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.local exists (your working config)
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "📄 Please make sure your working .env.local file exists."
    exit 1
fi

# Load environment variables from your working config
source .env.local
echo "✅ Using .env.local configuration for deployment"

# Validate required environment variables
required_vars=(
    "NEXT_PUBLIC_AZURE_CLIENT_ID"
    "NEXT_PUBLIC_AZURE_TENANT_ID"
    "NEXT_PUBLIC_API_BASE_URL"
)

echo "🔍 Validating environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set in .env.local"
        exit 1
    fi
done
echo "✅ Environment variables validated"

# Check if nginx-proxy network exists
if ! docker network ls | grep -q "nginx-proxy"; then
    echo "❌ nginx-proxy network not found. Please set up nginx-proxy first:"
    echo "   https://github.com/nginx-proxy/nginx-proxy"
    echo "   https://github.com/nginx-proxy/acme-companion"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads
chmod 755 logs uploads

# Stop existing container if running
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images (optional, comment out if you want to keep them)
echo "🧹 Cleaning up old images..."
docker image prune -f || true

# Build and start the application
echo "🏗️  Building and starting the application..."
docker-compose up -d --build

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Check if container is running
if ! docker ps | grep -q "$APP_NAME"; then
    echo "❌ Container $APP_NAME is not running. Checking logs..."
    docker-compose logs recruiter-app
    exit 1
fi

# Health check
echo "🏥 Performing health check..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ Health check passed!"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ Health check failed after 10 attempts"
        echo "📋 Container logs:"
        docker-compose logs --tail=50 recruiter-app
        exit 1
    else
        echo "⏳ Health check attempt $i/10..."
        sleep 10
    fi
done

# Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo "----------------------------------------"
echo "📊 Application Status:"
docker-compose ps
echo ""
echo "🌐 Access your application:"
echo "   https://$DOMAIN"
echo ""
echo "🔍 Useful commands:"
echo "   View logs:           docker-compose logs -f recruiter-app"
echo "   View all logs:       docker-compose logs -f"
echo "   Stop application:    docker-compose down"
echo "   Restart application: docker-compose restart recruiter-app"
echo "   Update application:  ./deploy.sh $ENVIRONMENT"
echo ""
echo "📋 Health check endpoint:"
echo "   https://$DOMAIN/api/health"
echo ""

# Show final logs
echo "📋 Recent application logs:"
docker-compose logs --tail=20 recruiter-app

echo ""
echo "🚀 Deployment script completed!"
echo "🔗 Your application should be available at: https://$DOMAIN"
echo "📞 If you encounter issues, check the logs with: docker-compose logs -f"