#!/bin/bash

# Deploy Backend with Completion Endpoint
# This script rebuilds and redeploys the backend Lambda functions

set -e

echo "🚀 Deploying Rainline Backend with Completion Endpoint..."

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

# Navigate to infrastructure
cd ../infrastructure

echo "☁️  Deploying to AWS..."
npm run deploy

echo "✅ Backend deployment complete!"
echo ""
echo "The completion endpoint is now available at:"
echo "POST /recommendations/{recommendationId}/complete"
echo ""
echo "You can now use the 'Mark as Completed' feature in the app."
