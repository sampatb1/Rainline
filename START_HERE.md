# 🌱 Rainline MVP - Start Here

Welcome to the Rainline irrigation recommendation system backend!

## 🎯 What Is This?

A serverless backend that provides intelligent irrigation recommendations for small farms by combining:
- **Rule-based logic** (crop type, soil, rainfall, temperature)
- **AI enhancement** (Amazon Bedrock Claude 3 Haiku)

## 📁 Project Structure

```
rainline-mvp/
├── 📖 Documentation (Start Here!)
│   ├── START_HERE.md ⭐ (You are here)
│   ├── QUICK_START.md (Deploy in 3 steps)
│   ├── README.md (Complete API reference)
│   ├── DEPLOYMENT.md (Detailed deployment guide)
│   ├── API_EXAMPLES.md (API usage examples)
│   ├── ARCHITECTURE.md (System architecture)
│   ├── CHECKLIST.md (Pre-deployment checklist)
│   ├── IMPLEMENTATION_SUMMARY.md (Technical details)
│   └── PROJECT_SUMMARY.md (What was built)
│
├── 🔧 Backend (TypeScript Lambda Functions)
│   ├── src/
│   │   ├── handlers/ (4 Lambda functions)
│   │   ├── services/ (Rule engine, Bedrock, DynamoDB)
│   │   ├── utils/ (Validation, responses)
│   │   └── types/ (TypeScript types)
│   ├── package.json
│   └── tsconfig.json
│
├── ☁️ Infrastructure (AWS CDK)
│   ├── lib/rainline-stack.ts (4 tables, 4 lambdas, API Gateway)
│   ├── bin/app.ts
│   ├── package.json
│   └── cdk.json
│
└── 🚀 Scripts
    ├── deploy.sh (Automated deployment)
    └── test-api.sh (Automated testing)
```

## ⚡ Quick Start (3 Steps)

### 1. Prerequisites

```bash
# Check Node.js (need 20+)
node --version

# Check AWS CLI
aws sts get-caller-identity

# Install CDK
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

## 📚 Documentation Guide

**New to the project?**
1. Read `QUICK_START.md` (5 min)
2. Run `deploy.sh` (5-10 min)
3. Test with `test-api.sh` (1 min)

**Want to understand the system?**
1. Read `ARCHITECTURE.md` (system design)
2. Read `IMPLEMENTATION_SUMMARY.md` (technical details)
3. Read `PROJECT_SUMMARY.md` (what was built)

**Ready to use the API?**
1. Read `README.md` (API reference)
2. Read `API_EXAMPLES.md` (usage examples)
3. Start building!

**Having issues?**
1. Check `CHECKLIST.md` (troubleshooting)
2. Check `DEPLOYMENT.md` (detailed guide)
3. Check CloudWatch logs

## 🎯 What You Get

### 4 API Endpoints

1. **POST /farms** - Create a farm
2. **POST /farms/{farmId}/fields** - Create a field
3. **POST /fields/{fieldId}/recommendations** - Get irrigation recommendation
4. **POST /recommendations/{recId}/feedback** - Submit feedback

### Intelligent Recommendations

**Rule Engine calculates:**
- Base water need (crop + growth stage)
- Soil adjustments (sandy/loam/clay)
- Rainfall subtraction
- Temperature adjustments (>90°F = +20%)
- Action: irrigate_now / irrigate_soon / wait

**AI Enhancement adds:**
- Farmer-friendly explanations
- Risk warnings
- Follow-up questions

**Example Response:**
```json
{
  "recommendation": {
    "recommendedInches": 1.44,
    "action": "irrigate_now",
    "timing": "Today",
    "reasoning": {
      "ruleBased": "Your corn in flowering stage needs...",
      "aiEnhanced": "Given the high temperature...",
      "aiAvailable": true
    }
  }
}
```

## 🔍 Quick Test

```bash
# Set your API URL
API="https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com/prod"

# Create farm
curl -X POST "$API/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"CA"}'

# Use the farmId from response to create a field
curl -X POST "$API/farms/FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}'

# Use the fieldId to get a recommendation
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
```

## 💰 Cost

**For light testing:**
- DynamoDB: ~$0.01/month
- Lambda: Free tier
- API Gateway: Free tier
- Bedrock: ~$0.50/month

**Total: < $1/month**

## 🧹 Cleanup

When done testing:

```bash
cd infrastructure
cdk destroy
```

## 🆘 Need Help?

### Common Issues

**Bedrock Access Denied**
→ Enable Claude 3 Haiku in Bedrock console

**Lambda Timeout**
→ Check CloudWatch logs for actual error

**Build Errors**
→ Run `npm install` in backend/ and infrastructure/

### Documentation

- `CHECKLIST.md` - Pre-deployment checklist
- `DEPLOYMENT.md` - Detailed deployment guide
- `API_EXAMPLES.md` - API usage examples

### Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/RainlineMvpStack-RecommendationsHandler --follow
```

## 🎓 What's Included

✅ 4 DynamoDB tables (on-demand billing)
✅ 4 Lambda functions (Node.js 20)
✅ API Gateway REST API (CORS enabled)
✅ Rule engine (deterministic irrigation logic)
✅ Bedrock integration (AI enhancement)
✅ Graceful AI degradation (works without Bedrock)
✅ Comprehensive error handling
✅ Input validation
✅ Automated deployment script
✅ Automated testing script
✅ Complete documentation

## 🚧 What's NOT Included (MVP Scope)

❌ Cognito authentication (uses demo-user)
❌ GET endpoints (only POST)
❌ Pagination
❌ Frontend (backend only)
❌ Unit tests
❌ CloudWatch dashboards

These will be added in future iterations!

## 🔜 Next Steps

After successful deployment:

1. ✅ Test all 4 endpoints
2. ✅ Verify AI enhancement working
3. ✅ Check CloudWatch logs
4. 🔜 Add Cognito authentication
5. 🔜 Build React frontend
6. 🔜 Add GET endpoints
7. 🔜 Add unit tests

## 📞 Quick Reference

| Document | Purpose | Time |
|----------|---------|------|
| QUICK_START.md | Deploy in 3 steps | 5 min |
| README.md | Complete API reference | 15 min |
| API_EXAMPLES.md | Usage examples | 10 min |
| ARCHITECTURE.md | System design | 10 min |
| DEPLOYMENT.md | Detailed deployment | 20 min |
| CHECKLIST.md | Pre-deployment checklist | 10 min |

## 🎉 Ready to Go!

You have everything you need to deploy and test the Rainline MVP backend.

**Start with:** `QUICK_START.md` → `deploy.sh` → `test-api.sh`

Good luck! 🌱
