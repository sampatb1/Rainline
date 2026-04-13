# Rainline MVP - Irrigation Recommendation System

A serverless web application that provides intelligent irrigation recommendations for small farms using AWS Lambda, DynamoDB, and Amazon Bedrock.

## 🌐 Live Production Application

**Frontend:** https://dg6vtbn7r4das.cloudfront.net  
**Backend API:** https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com/prod/

✅ **Status:** Deployed and running on AWS

## Architecture

- **Frontend**: React 19 + TypeScript (CloudFront + S3)
- **Backend**: TypeScript Lambda functions (Node.js 20)
- **Database**: DynamoDB (4 tables)
- **AI**: Amazon Bedrock (Claude 3 Haiku)
- **API**: API Gateway REST API
- **Infrastructure**: AWS CDK

## Project Structure

```
rainline-mvp/
├── backend/
│   ├── src/
│   │   ├── handlers/          # Lambda function handlers
│   │   │   ├── farms.ts
│   │   │   ├── fields.ts
│   │   │   ├── recommendations.ts
│   │   │   └── feedback.ts
│   │   ├── services/          # Business logic services
│   │   │   ├── dynamodb.ts
│   │   │   ├── ruleEngine.ts
│   │   │   └── bedrock.ts
│   │   ├── utils/             # Utilities
│   │   │   ├── validation.ts
│   │   │   └── response.ts
│   │   └── types/             # TypeScript types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/
│   ├── lib/
│   │   └── rainline-stack.ts  # CDK stack definition
│   ├── bin/
│   │   └── app.ts
│   ├── package.json
│   └── cdk.json
└── README.md
```

## Prerequisites

- Node.js 20+
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Access to Amazon Bedrock (Claude 3 Haiku model enabled in your region)

## Setup & Deployment

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install
cd ..

# Infrastructure dependencies
cd infrastructure
npm install
cd ..
```

### 2. Build Backend

```bash
cd backend
npm run build
cd ..
```

### 3. Deploy Infrastructure

```bash
cd infrastructure
cdk bootstrap  # First time only
cdk deploy
cd ..
```

The deployment will output the API Gateway URL.

## API Endpoints

Base URL: `https://<api-id>.execute-api.<region>.amazonaws.com/prod/`

### 1. Create Farm

```bash
POST /farms
Content-Type: application/json

{
  "name": "Green Valley Farm",
  "location": "California"
}
```

Response:
```json
{
  "farm": {
    "farmId": "uuid",
    "userId": "demo-user",
    "name": "Green Valley Farm",
    "location": "California",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Create Field

```bash
POST /farms/{farmId}/fields
Content-Type: application/json

{
  "name": "North Field",
  "cropType": "corn",
  "soilType": "loam",
  "area": 5.5
}
```

Response:
```json
{
  "field": {
    "fieldId": "uuid",
    "farmId": "farm-uuid",
    "userId": "demo-user",
    "name": "North Field",
    "cropType": "corn",
    "soilType": "loam",
    "area": 5.5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Generate Recommendation

```bash
POST /fields/{fieldId}/recommendations
Content-Type: application/json

{
  "conditions": {
    "cropType": "corn",
    "soilType": "loam",
    "growthStage": "flowering",
    "lastIrrigation": "2024-01-15T00:00:00.000Z",
    "rainfall": 10,
    "temperature": 85
  }
}
```

Response:
```json
{
  "recommendation": {
    "recommendationId": "uuid",
    "fieldId": "field-uuid",
    "userId": "demo-user",
    "timestamp": "2024-01-20T00:00:00.000Z",
    "conditions": { ... },
    "recommendedInches": 1.2,
    "action": "irrigate_now",
    "timing": "Today",
    "reasoning": {
      "ruleBased": "Your corn in flowering stage needs...",
      "aiEnhanced": "Based on the current conditions...",
      "aiAvailable": true
    },
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

### 4. Submit Feedback

```bash
POST /recommendations/{recommendationId}/feedback
Content-Type: application/json

{
  "worked": true,
  "comment": "The recommendation was very helpful"
}
```

Response:
```json
{
  "feedback": {
    "feedbackId": "uuid",
    "recommendationId": "rec-uuid",
    "userId": "demo-user",
    "worked": true,
    "comment": "The recommendation was very helpful",
    "createdAt": "2024-01-21T00:00:00.000Z"
  }
}
```

## Testing the API

### Example Flow

```bash
# Set your API URL
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"

# 1. Create a farm
FARM_RESPONSE=$(curl -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"California"}')

FARM_ID=$(echo $FARM_RESPONSE | jq -r '.farm.farmId')

# 2. Create a field
FIELD_RESPONSE=$(curl -X POST "$API_URL/farms/$FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"Field 1","cropType":"corn","soilType":"loam","area":10}')

FIELD_ID=$(echo $FIELD_RESPONSE | jq -r '.field.fieldId')

# 3. Get recommendation
REC_RESPONSE=$(curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
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
  }')

REC_ID=$(echo $REC_RESPONSE | jq -r '.recommendation.recommendationId')

# 4. Submit feedback
curl -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked":true,"comment":"Great recommendation!"}'
```

## Rule Engine Logic

The rule engine calculates irrigation recommendations based on:

1. **Base water requirement**: Varies by crop type and growth stage
2. **Soil adjustment**: Sandy soil needs more, clay retains longer
3. **Rainfall subtraction**: Recent rainfall reduces water needs
4. **Temperature adjustment**: >90°F increases requirement by 20%
5. **Days since irrigation**: Determines urgency

Actions:
- `irrigate_now`: Immediate irrigation needed
- `irrigate_soon`: Irrigate within 1-2 days
- `wait`: Sufficient moisture, no irrigation needed

## Bedrock AI Enhancement

The system calls Amazon Bedrock (Claude 3 Haiku) to enhance recommendations with:
- Farmer-friendly explanations
- Risk warnings and considerations
- Follow-up questions

If Bedrock fails or times out (5s), the system gracefully degrades to rule-based recommendations only.

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `MISSING_BODY`: Request body required
- `INVALID_JSON`: Malformed JSON
- `FARM_NOT_FOUND`: Farm doesn't exist
- `FIELD_NOT_FOUND`: Field doesn't exist
- `DUPLICATE_FEEDBACK`: Feedback already submitted
- `INTERNAL_ERROR`: Server error

## DynamoDB Tables

### rainline-farms
- PK: `userId`
- SK: `farmId`

### rainline-fields
- PK: `farmId`
- SK: `fieldId`
- GSI: `UserFieldsIndex` (userId, fieldId)

### rainline-recommendations
- PK: `fieldId`
- SK: `timestamp`
- GSI: `RecommendationIdIndex` (recommendationId)

### rainline-feedback
- PK: `recommendationId`
- SK: `userId`

## Cleanup

To remove all resources:

```bash
cd infrastructure
cdk destroy
```

## Notes

- Currently uses `demo-user` as a hardcoded userId (Cognito integration pending)
- All tables use on-demand billing for cost efficiency
- Lambda timeout: 10s (farms, fields, feedback), 30s (recommendations)
- Bedrock timeout: 5s with graceful degradation

## Next Steps

- [ ] Add Cognito authentication
- [ ] Implement GET endpoints for listing resources
- [ ] Add frontend React application
- [ ] Implement pagination for recommendations
- [ ] Add CloudWatch monitoring and alarms
- [ ] Add unit and integration tests
