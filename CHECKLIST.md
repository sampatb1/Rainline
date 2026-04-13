# Rainline MVP - Pre-Deployment Checklist

## ✅ Before You Deploy

### 1. AWS Prerequisites

- [ ] AWS CLI installed and configured
  ```bash
  aws --version
  aws sts get-caller-identity
  ```

- [ ] AWS account has appropriate permissions:
  - [ ] DynamoDB (CreateTable, PutItem, GetItem, Query)
  - [ ] Lambda (CreateFunction, UpdateFunctionCode)
  - [ ] API Gateway (CreateRestApi, CreateResource)
  - [ ] IAM (CreateRole, AttachRolePolicy)
  - [ ] CloudFormation (CreateStack, UpdateStack)
  - [ ] Bedrock (InvokeModel)

- [ ] Amazon Bedrock access enabled:
  - [ ] Go to AWS Console → Amazon Bedrock
  - [ ] Navigate to "Model access"
  - [ ] Enable "Claude 3 Haiku" by Anthropic
  - [ ] Verify access is granted

### 2. Local Environment

- [ ] Node.js 20+ installed
  ```bash
  node --version  # Should be v20.x.x or higher
  ```

- [ ] npm installed
  ```bash
  npm --version
  ```

- [ ] AWS CDK CLI installed globally
  ```bash
  npm install -g aws-cdk
  cdk --version
  ```

- [ ] jq installed (optional, for parsing JSON)
  ```bash
  # macOS
  brew install jq
  
  # Linux
  sudo apt-get install jq
  ```

### 3. Project Files

- [ ] All backend files present:
  - [ ] `backend/src/handlers/` (4 files)
  - [ ] `backend/src/services/` (3 files)
  - [ ] `backend/src/utils/` (2 files)
  - [ ] `backend/src/types/` (1 file)
  - [ ] `backend/package.json`
  - [ ] `backend/tsconfig.json`

- [ ] All infrastructure files present:
  - [ ] `infrastructure/lib/rainline-stack.ts`
  - [ ] `infrastructure/bin/app.ts`
  - [ ] `infrastructure/package.json`
  - [ ] `infrastructure/cdk.json`

- [ ] Scripts are executable:
  ```bash
  chmod +x deploy.sh test-api.sh
  ```

## 🚀 Deployment Steps

### Step 1: Build Backend

```bash
cd backend
npm install
npm run build
cd ..
```

**Verify:**
- [ ] `backend/node_modules/` exists
- [ ] `backend/dist/` exists with compiled JS files

### Step 2: Bootstrap CDK (First Time Only)

```bash
cd infrastructure
npm install
cdk bootstrap
cd ..
```

**Verify:**
- [ ] `infrastructure/node_modules/` exists
- [ ] CDK bootstrap stack created in CloudFormation

### Step 3: Deploy Stack

```bash
cd infrastructure
cdk deploy
cd ..
```

**Verify:**
- [ ] Deployment completes without errors
- [ ] API URL is displayed in outputs
- [ ] CloudFormation stack shows CREATE_COMPLETE

### Step 4: Save API URL

```bash
# Copy the API URL from CDK output
# Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
```

- [ ] API URL saved for testing

## 🧪 Post-Deployment Verification

### 1. Check AWS Resources

```bash
# DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `rainline`)]'
```
- [ ] rainline-farms
- [ ] rainline-fields
- [ ] rainline-recommendations
- [ ] rainline-feedback

```bash
# Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `Rainline`)].FunctionName'
```
- [ ] RainlineMvpStack-FarmsHandler
- [ ] RainlineMvpStack-FieldsHandler
- [ ] RainlineMvpStack-RecommendationsHandler
- [ ] RainlineMvpStack-FeedbackHandler

```bash
# API Gateway
aws apigateway get-rest-apis --query 'items[?name==`Rainline MVP API`]'
```
- [ ] Rainline MVP API exists

### 2. Test Endpoints

**Option A: Automated Test**
```bash
./test-api.sh https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com/prod
```

**Option B: Manual Tests**

- [ ] Test 1: Create Farm
  ```bash
  curl -X POST "$API_URL/farms" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Farm","location":"CA"}'
  ```
  Expected: 201 status, farm object with farmId

- [ ] Test 2: Create Field
  ```bash
  curl -X POST "$API_URL/farms/{farmId}/fields" \
    -H "Content-Type: application/json" \
    -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}'
  ```
  Expected: 201 status, field object with fieldId

- [ ] Test 3: Generate Recommendation
  ```bash
  curl -X POST "$API_URL/fields/{fieldId}/recommendations" \
    -H "Content-Type: application/json" \
    -d '{
      "conditions": {
        "cropType": "corn",
        "soilType": "loam",
        "growthStage": "flowering",
        "lastIrrigation": "2024-01-15T00:00:00Z",
        "rainfall": 5,
        "temperature": 92
      }
    }'
  ```
  Expected: 201 status, recommendation with rule-based + AI reasoning

- [ ] Test 4: Submit Feedback
  ```bash
  curl -X POST "$API_URL/recommendations/{recId}/feedback" \
    -H "Content-Type: application/json" \
    -d '{"worked":true,"comment":"Great!"}'
  ```
  Expected: 201 status, feedback object

### 3. Verify AI Enhancement

- [ ] Recommendation response includes `reasoning.aiEnhanced`
- [ ] `reasoning.aiAvailable` is `true`
- [ ] AI reasoning is different from rule-based reasoning
- [ ] No markdown formatting in AI response

### 4. Check CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

- [ ] No error messages
- [ ] Bedrock calls succeeding
- [ ] DynamoDB operations succeeding

### 5. Verify Data in DynamoDB

```bash
# Check farms table
aws dynamodb scan --table-name rainline-farms --max-items 5

# Check recommendations table
aws dynamodb scan --table-name rainline-recommendations --max-items 5
```

- [ ] Data is being stored correctly
- [ ] Timestamps are present
- [ ] All required fields exist

## 🐛 Troubleshooting

### Issue: Bedrock Access Denied

**Symptoms:**
- Error: `AccessDeniedException: Could not access model`
- `aiAvailable: false` in all responses

**Fix:**
- [ ] Enable Claude 3 Haiku in Bedrock console
- [ ] Check region supports Bedrock (us-east-1, us-west-2)
- [ ] Verify IAM role has `bedrock:InvokeModel` permission

### Issue: Lambda Timeout

**Symptoms:**
- Error: `Task timed out after X seconds`
- 504 Gateway Timeout

**Fix:**
- [ ] Check CloudWatch logs for actual error
- [ ] Verify Bedrock is responding (not region issue)
- [ ] Increase Lambda timeout if needed (currently 30s for recommendations)

### Issue: DynamoDB Access Denied

**Symptoms:**
- Error: `AccessDeniedException` on DynamoDB operations
- 500 Internal Server Error

**Fix:**
- [ ] Redeploy: `cdk deploy --force`
- [ ] Check Lambda execution role has DynamoDB permissions
- [ ] Verify table names match environment variables

### Issue: CORS Errors

**Symptoms:**
- Browser console: `CORS policy blocking`
- Preflight OPTIONS request fails

**Fix:**
- [ ] API Gateway has CORS enabled (already configured)
- [ ] Use correct HTTP method (POST, not GET)
- [ ] Check request headers include `Content-Type: application/json`

### Issue: Build Errors

**Symptoms:**
- TypeScript compilation fails
- `npm run build` errors

**Fix:**
- [ ] Delete `node_modules/` and reinstall: `npm install`
- [ ] Check Node.js version is 20+
- [ ] Verify all source files are present

## 📊 Success Indicators

✅ All 4 DynamoDB tables created
✅ All 4 Lambda functions deployed
✅ API Gateway URL accessible
✅ All 4 POST endpoints return 201
✅ Recommendations include AI reasoning
✅ CloudWatch logs show no errors
✅ Data persists in DynamoDB
✅ Feedback prevents duplicates

## 🧹 Cleanup (When Done Testing)

```bash
cd infrastructure
cdk destroy
```

- [ ] Confirm deletion
- [ ] Verify CloudFormation stack deleted
- [ ] Check DynamoDB tables removed
- [ ] Verify Lambda functions deleted

## 📝 Notes

- Current implementation uses `demo-user` (no auth)
- Only POST endpoints implemented (no GET)
- No pagination (not needed for MVP)
- Bedrock timeout: 5 seconds
- Lambda timeout: 10s (most), 30s (recommendations)

## 🎯 Next Steps After Successful Deployment

1. [ ] Test with different crop types and conditions
2. [ ] Verify rule engine calculations are correct
3. [ ] Check AI reasoning quality
4. [ ] Monitor costs in AWS Billing dashboard
5. [ ] Plan Cognito integration
6. [ ] Design frontend UI
7. [ ] Add GET endpoints
8. [ ] Implement pagination
9. [ ] Add unit tests
10. [ ] Set up CI/CD pipeline

## 📚 Reference Documentation

- `README.md` - Complete API reference
- `DEPLOYMENT.md` - Detailed deployment guide
- `QUICK_START.md` - Fast reference
- `IMPLEMENTATION_SUMMARY.md` - Technical details

---

**Ready to deploy?** Start with `./deploy.sh` and follow this checklist!
