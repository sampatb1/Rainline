#!/bin/bash
set -e

echo "🚀 Deploying Rainline MVP Backend..."

# Build backend
echo "📦 Building backend..."
cd backend
npm install
npm run build
cd ..

# Deploy infrastructure
echo "☁️  Deploying infrastructure..."
cd infrastructure
npm install
cdk deploy --require-approval never
cd ..

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check the API URL in the CDK output"
echo "2. Test the endpoints using the examples in README.md"
echo "3. Ensure Amazon Bedrock access is enabled in your AWS account"
