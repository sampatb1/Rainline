#!/bin/bash

# Rainline MVP - Production Deployment Script
# This script builds and deploys both backend and frontend to AWS

set -e  # Exit on any error

echo "🚀 Starting Rainline MVP Production Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Backend
echo -e "${BLUE}📦 Step 1/3: Building Backend...${NC}"
cd backend
npm run build
cd ..
echo -e "${GREEN}✅ Backend build complete${NC}"
echo ""

# Step 2: Build Frontend
echo -e "${BLUE}📦 Step 2/3: Building Frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✅ Frontend build complete${NC}"
echo ""

# Step 3: Deploy to AWS
echo -e "${BLUE}🚀 Step 3/3: Deploying to AWS...${NC}"
cd infrastructure
cdk deploy --require-approval never
cd ..
echo ""

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Frontend URL: Check CDK output for 'WebsiteUrl'"
echo "Backend API:  https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com/prod/"
echo ""
echo "View full deployment details in PRODUCTION_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}🎉 Your application is now live!${NC}"
