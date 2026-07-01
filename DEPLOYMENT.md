# 🚀 Deployment Guide

## Prerequisites
- VPS with 2GB+ RAM
- Docker & Docker Compose

## Deploy
\`\`\`bash
git clone <repo>
cd fuel-station-system
cp .env.example .env
nano .env  # Update JWT_SECRET
docker-compose up -d --build
docker exec -it fueltrack-api node seed.js
\`\`\`

## Access
- Frontend: http://your-server-ip
- API: http://your-server-ip:5000