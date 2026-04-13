# Rainline MVP - Deployment Guide

## 🚀 Quick Production Deployment

The fastest way to deploy both backend and frontend to production:

```bash
# 1. Build backend
cd backend
npm run build

# 2. Build frontend
cd ../frontend
npm run build

# 3. Deploy everything to AWS
cd ../infrastructure
cdk deploy
```

After deployment completes, you'll receive:
- **Frontend URL:** CloudFront distribution URL (e.g., https://xxxxx.cloudfront.net)
- **Backend API URL:** API Gateway endpoint (e.g., https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/)

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed production deployment information.

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js 20+** installed
4. **AWS CDK CLI** installed globally:
   ```bash
   npm install -g aws-cdk
   ```
5. **Amazon Bedrock Access** - Enable Claude 3 Haiku model in your AWS region

## Enable Amazon Bedrock

Before deploying, ensure you have access to Amazon Bedrock:

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable "Claude 3 Haiku" by Anthropic
5. Wait for access to be granted (usually instant)

## Quick Deploy

Use the automated deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Install backend dependencies
2. Build TypeScript code
3. Install infrastructure dependencies
4. Deploy CDK stack to AWS

## Manual Deployment

### Step 1: Build Backend

```bash
cd backend
npm install
npm run build
cd ..
```

This compiles TypeScript to JavaScript in `backend/dist/`.

### Step 2: Bootstrap CDK (First Time Only)

```bash
cd infrastructure
npm install
cdk bootstrap
```

### Step 3: Deploy Infrastructure

```bash
cdk deploy
```

Review the changes and confirm deployment.

### Step 4: Note the API URL

After deployment, CDK will output the API Gateway URL:

```
Outputs:
RainlineMvpStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
```

Save this URL for testing.

## Testing the Deployment

### Option 1: Use the Test Script

```bash
chmod +x test-api.sh
./test-api.sh https://your-api-url.execute-api.us-east-1.amazonaws.com/prod
```

### Option 2: Manual Testing

```bash
# Set your API URL
export API_URL="https://your-api-url.execute-api.us-east-1.amazonaws.com/prod"

# Create a farm
curl -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"California"}'

# Create a field (use farmId from previous response)
curl -X POST "$API_URL/farms/{farmId}/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}'

# Generate recommendation (use fieldId from previous response)
curl -X POST "$API_URL/fields/{fieldId}/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-15T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 92
    }
  }'

# Submit feedback (use recommendationId from previous response)
curl -X POST "$API_URL/recommendations/{recommendationId}/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked":true,"comment":"Great advice!"}'
```

## Verify Deployment

Check that all resources were created:

```bash
# List DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `rainline`)]'

# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `Rainline`)].FunctionName'

# Get API Gateway details
aws apigateway get-rest-apis --query 'items[?name==`Rainline MVP API`]'
```

## Monitoring

### CloudWatch Logs

Lambda logs are automatically sent to CloudWatch:

```bash
# View farms handler logs
aws logs tail /aws/lambda/RainlineMvpStack-FarmsHandler --follow

# View recommendations handler logs
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

### DynamoDB Tables

Check table contents:

```bash
# Scan farms table
aws dynamodb scan --table-name rainline-farms

# Scan fields table
aws dynamodb scan --table-name rainline-fields

# Scan recommendations table
aws dynamodb scan --table-name rainline-recommendations
```

## Updating the Deployment

After making code changes:

```bash
# Rebuild backend
cd backend
npm run build
cd ..

# Redeploy
cd infrastructure
cdk deploy
```

## Troubleshooting

### Issue: Bedrock Access Denied

**Error**: `AccessDeniedException: Could not access model`

**Solution**: 
1. Enable Claude 3 Haiku in Amazon Bedrock console
2. Ensure your AWS region supports Bedrock (us-east-1, us-west-2, etc.)
3. Check IAM permissions include `bedrock:InvokeModel`

### Issue: Lambda Timeout

**Error**: Task timed out after 10.00 seconds

**Solution**: 
- Recommendations handler has 30s timeout for Bedrock calls
- Check CloudWatch logs for actual error
- Bedrock has internal 5s timeout with graceful degradation

### Issue: DynamoDB Access Denied

**Error**: `AccessDeniedException` on DynamoDB operations

**Solution**:
- CDK automatically grants permissions
- Redeploy: `cdk deploy --force`
- Check Lambda execution role has DynamoDB permissions

### Issue: CORS Errors

**Error**: CORS policy blocking requests

**Solution**:
- API Gateway has CORS enabled for all origins
- Ensure you're using correct HTTP methods
- Check preflight OPTIONS requests succeed

## Cost Estimation

For development/testing with minimal usage:

- **DynamoDB**: Pay-per-request, ~$0.25 per million requests
- **Lambda**: Free tier covers 1M requests/month
- **API Gateway**: Free tier covers 1M requests/month
- **Bedrock**: ~$0.00025 per 1K input tokens, ~$0.00125 per 1K output tokens

Expected monthly cost for light testing: **< $5**

## Cleanup

To remove all resources and stop incurring charges:

```bash
cd infrastructure
cdk destroy
```

Confirm deletion when prompted. This will:
- Delete all Lambda functions
- Delete API Gateway
- Delete DynamoDB tables (and all data)
- Delete IAM roles

## Security Notes

- Currently uses hardcoded `demo-user` userId
- No authentication implemented yet (Cognito pending)
- API is publicly accessible
- For production, add:
  - Cognito authentication
  - API Gateway authorizers
  - WAF rules
  - Rate limiting
  - VPC endpoints for DynamoDB

## Next Steps

1. Test all 4 endpoints thoroughly
2. Verify Bedrock AI enhancement is working
3. Check CloudWatch logs for any errors
4. Monitor DynamoDB table sizes
5. Plan frontend development
