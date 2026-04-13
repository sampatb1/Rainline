# Rainline MVP - Quick Start Guide

## 🚀 Deploy in 3 Steps

### 1. Prerequisites Check

```bash
# Check Node.js version (need 20+)
node --version

# Check AWS CLI is configured
aws sts get-caller-identity

# Install CDK globally if needed
npm install -g aws-cdk
```

### 2. Enable Amazon Bedrock

1. Open AWS Console → Amazon Bedrock
2. Click "Model access" → "Manage model access"
3. Enable "Claude 3 Haiku" by Anthropic
4. Wait for approval (usually instant)

### 3. Deploy

```bash
# Make scripts executable
chmod +x deploy.sh test-api.sh

# Deploy everything
./deploy.sh
```

Save the API URL from the output!

## 🧪 Test Your Deployment

```bash
# Run automated tests
./test-api.sh https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com/prod
```

## 📋 Manual Test Flow

```bash
# Set your API URL
API="https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com/prod"

# 1. Create Farm
curl -X POST "$API/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Green Valley","location":"CA"}'
# Save the farmId from response

# 2. Create Field
curl -X POST "$API/farms/FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"North Field","cropType":"corn","soilType":"loam"}'
# Save the fieldId from response

# 3. Get Recommendation
curl -X POST "$API/fields/FIELD_ID/recommendations" \
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
# Save the recommendationId from response

# 4. Submit Feedback
curl -X POST "$API/recommendations/REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked":true,"comment":"Helpful!"}'
```

## 🎯 What You Get

### Rule Engine
Calculates irrigation needs based on:
- Crop type & growth stage
- Soil type (sandy/loam/clay)
- Recent rainfall
- Temperature (>90°F = +20% water)
- Days since last irrigation

### AI Enhancement (Bedrock)
Adds to rule-based recommendation:
- Farmer-friendly explanations
- Risk warnings
- Follow-up questions

### Graceful Degradation
If Bedrock fails → returns rule-based recommendation only

## 📊 Example Response

```json
{
  "recommendation": {
    "recommendationId": "abc-123",
    "fieldId": "field-456",
    "recommendedInches": 1.44,
    "action": "irrigate_now",
    "timing": "Today",
    "reasoning": {
      "ruleBased": "Your corn in flowering stage needs approximately 1.50 inches per week. It has been 5 days since last irrigation. After accounting for 0.20 inches of recent rainfall and loam soil characteristics, immediate irrigation of 1.44 inches is recommended. High temperature (92°F) increases water demand by 20%.",
      "aiEnhanced": "Given the high temperature and flowering stage, your corn is at peak water demand. The 20% increase accounts for evapotranspiration losses. Consider irrigating early morning to minimize water loss.",
      "aiAvailable": true
    }
  }
}
```

## 🔍 Verify Deployment

```bash
# Check DynamoDB tables
aws dynamodb list-tables | grep rainline

# Check Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `Rainline`)].FunctionName'

# View logs
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

## 🧹 Cleanup

```bash
cd infrastructure
cdk destroy
```

## ❓ Troubleshooting

### Bedrock Access Denied
→ Enable Claude 3 Haiku in Bedrock console

### Lambda Timeout
→ Check CloudWatch logs for actual error

### CORS Errors
→ Ensure using correct HTTP methods (POST)

### Build Errors
→ Run `npm install` in backend/ and infrastructure/

## 📚 Full Documentation

- `README.md` - Complete API reference
- `DEPLOYMENT.md` - Detailed deployment guide
- `.kiro/specs/rainline-mvp/` - Full specification

## 💡 Tips

1. **Use jq** for parsing JSON responses:
   ```bash
   curl ... | jq '.farm.farmId'
   ```

2. **Save IDs** between requests:
   ```bash
   FARM_ID=$(curl ... | jq -r '.farm.farmId')
   ```

3. **Check logs** if something fails:
   ```bash
   aws logs tail /aws/lambda/RainlineMvpStack-FarmsHandler --follow
   ```

4. **Test Bedrock separately**:
   ```bash
   aws bedrock-runtime invoke-model \
     --model-id anthropic.claude-3-haiku-20240307-v1:0 \
     --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
     output.json
   ```

## 🎉 Success Indicators

✅ CDK deploy completes without errors
✅ API URL is returned in outputs
✅ All 4 test requests succeed
✅ Recommendation includes AI reasoning
✅ CloudWatch logs show no errors

## 🚧 Known Limitations (MVP)

- No authentication (uses demo-user)
- No GET endpoints (only POST)
- No pagination
- No frontend yet
- No monitoring dashboards

These will be added in future iterations!
