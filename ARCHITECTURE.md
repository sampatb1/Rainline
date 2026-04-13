# Rainline MVP - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                  (REST API with CORS)                            │
└────────┬────────────┬────────────┬────────────┬─────────────────┘
         │            │            │            │
         │ POST       │ POST       │ POST       │ POST
         │ /farms     │ /farms/    │ /fields/   │ /recommendations/
         │            │ {id}/      │ {id}/      │ {id}/feedback
         │            │ fields     │ recommend  │
         │            │            │            │
    ┌────▼────┐  ┌───▼─────┐  ┌──▼──────┐  ┌──▼──────┐
    │ Farms   │  │ Fields  │  │ Recomm  │  │Feedback │
    │ Handler │  │ Handler │  │ Handler │  │ Handler │
    │ Lambda  │  │ Lambda  │  │ Lambda  │  │ Lambda  │
    │ (10s)   │  │ (10s)   │  │ (30s)   │  │ (10s)   │
    └────┬────┘  └───┬─────┘  └──┬──────┘  └──┬──────┘
         │           │            │            │
         │           │            │            │
         │           │       ┌────▼────┐       │
         │           │       │  Rule   │       │
         │           │       │ Engine  │       │
         │           │       │ Service │       │
         │           │       └────┬────┘       │
         │           │            │            │
         │           │       ┌────▼────┐       │
         │           │       │ Bedrock │       │
         │           │       │ Service │       │
         │           │       │ (5s TO) │       │
         │           │       └────┬────┘       │
         │           │            │            │
         │           │            ▼            │
         │           │      ┌──────────┐       │
         │           │      │ Amazon   │       │
         │           │      │ Bedrock  │       │
         │           │      │ (Claude) │       │
         │           │      └──────────┘       │
         │           │                         │
    ┌────▼───────────▼────────────┬───────────▼──────┐
    │                              │                  │
    │         DynamoDB Tables      │                  │
    │                              │                  │
    │  ┌──────────────┐  ┌────────▼────────┐  ┌─────▼──────┐
    │  │   Farms      │  │    Fields       │  │Recommend   │
    │  │              │  │                 │  │            │
    │  │ PK: userId   │  │ PK: farmId      │  │PK: fieldId │
    │  │ SK: farmId   │  │ SK: fieldId     │  │SK: time    │
    │  └──────────────┘  │                 │  │            │
    │                    │ GSI: userId     │  │GSI: recId  │
    │                    └─────────────────┘  └────────────┘
    │                                                        │
    │                    ┌─────────────────┐                │
    │                    │   Feedback      │                │
    │                    │                 │                │
    │                    │ PK: recId       │                │
    │                    │ SK: userId      │                │
    │                    └─────────────────┘                │
    └───────────────────────────────────────────────────────┘
```

## Request Flow: Generate Recommendation

```
1. Client Request
   │
   ├─→ POST /fields/{fieldId}/recommendations
   │   Body: { conditions: { cropType, soilType, ... } }
   │
2. API Gateway
   │
   ├─→ Routes to Recommendations Lambda
   │
3. Recommendations Handler
   │
   ├─→ Validate input (validation.ts)
   │   ├─ Check required fields
   │   ├─ Validate data types
   │   └─ Check ranges
   │
   ├─→ Verify field exists (dynamodb.ts)
   │   └─ Query fields table by userId
   │
   ├─→ Run Rule Engine (ruleEngine.ts)
   │   ├─ Calculate base water requirement
   │   ├─ Adjust for soil type
   │   ├─ Subtract rainfall
   │   ├─ Adjust for temperature
   │   ├─ Determine action (irrigate_now/soon/wait)
   │   └─ Generate rule-based reasoning
   │
   ├─→ Call Bedrock Service (bedrock.ts)
   │   ├─ Build prompt with conditions + rule rec
   │   ├─ Call Bedrock API (5s timeout)
   │   ├─ Parse JSON response
   │   └─ Return AI reasoning (or null if failed)
   │
   ├─→ Combine Results
   │   ├─ Merge rule-based + AI reasoning
   │   ├─ Set aiAvailable flag
   │   └─ Create recommendation object
   │
   ├─→ Store in DynamoDB (dynamodb.ts)
   │   └─ Put item in recommendations table
   │
   └─→ Return Response (response.ts)
       └─ 201 Created with recommendation object
```

## Data Flow

```
┌──────────────┐
│   Client     │
│   Request    │
└──────┬───────┘
       │
       │ Field Conditions
       │ {cropType, soilType, growthStage,
       │  lastIrrigation, rainfall, temp}
       │
       ▼
┌──────────────────┐
│  Rule Engine     │
│                  │
│  Base Req:       │  Corn flowering = 1.5 in/week
│  Soil Adj:       │  Loam = 1.0x
│  Rainfall:       │  5mm = 0.2 in → 1.3 in
│  Temperature:    │  92°F → 1.3 × 1.2 = 1.56 in
│  Days Since:     │  5 days → irrigate_now
│                  │
│  Output:         │
│  - recommendedInches: 1.56
│  - action: irrigate_now
│  - timing: Today
│  - ruleReasoning: "Your corn..."
└──────┬───────────┘
       │
       │ Rule-Based Recommendation
       │
       ▼
┌──────────────────┐
│  Bedrock AI      │
│  (Claude 3)      │
│                  │
│  Input:          │  Field conditions + rule rec
│  Processing:     │  AI analysis & enhancement
│  Output:         │
│  - aiReasoning: "Given high temp..."
│  - riskWarning: "Watch for heat stress"
│  - followUpQuestions: [...]
└──────┬───────────┘
       │
       │ AI Enhancement
       │
       ▼
┌──────────────────┐
│  Final           │
│  Recommendation  │
│                  │
│  {               │
│    recommendationId,
│    fieldId,
│    recommendedInches: 1.56,
│    action: "irrigate_now",
│    timing: "Today",
│    reasoning: {
│      ruleBased: "...",
│      aiEnhanced: "...",
│      aiAvailable: true
│    },
│    conditions: {...},
│    createdAt: "..."
│  }               │
└──────┬───────────┘
       │
       │ Store in DynamoDB
       │
       ▼
┌──────────────────┐
│  DynamoDB        │
│  Recommendations │
│  Table           │
└──────────────────┘
```

## Rule Engine Logic

```
Input: Field Conditions
  ├─ cropType: "corn"
  ├─ soilType: "loam"
  ├─ growthStage: "flowering"
  ├─ lastIrrigation: "2024-01-15"
  ├─ rainfall: 5 mm
  └─ temperature: 92°F

Step 1: Base Water Requirement
  └─ Lookup: WATER_REQUIREMENTS[corn][flowering] = 1.5 in/week

Step 2: Soil Adjustment
  └─ Factor: SOIL_FACTORS[loam] = 1.0x
  └─ Result: 1.5 × 1.0 = 1.5 in

Step 3: Rainfall Subtraction
  └─ Convert: 5mm ÷ 25.4 = 0.20 in
  └─ Result: 1.5 - 0.20 = 1.3 in

Step 4: Temperature Adjustment
  └─ Check: 92°F > 90°F → Apply +20%
  └─ Result: 1.3 × 1.2 = 1.56 in

Step 5: Days Since Irrigation
  └─ Calculate: Today - 2024-01-15 = 5 days
  └─ Weekly need: 1.56 in
  └─ Daily need: 1.56 ÷ 7 = 0.22 in/day
  └─ Accumulated: 0.22 × 5 = 1.1 in
  └─ Threshold: 1.1 ÷ 1.56 = 70% (< 80%)

Step 6: Determine Action
  └─ If accumulated ≥ 80% → irrigate_now
  └─ If accumulated ≥ 50% → irrigate_soon
  └─ If accumulated < 50% → wait
  └─ Result: 70% → irrigate_soon

Output: Preliminary Recommendation
  ├─ recommendedInches: 1.56
  ├─ action: "irrigate_soon"
  ├─ timing: "Within 1-2 days"
  └─ ruleReasoning: "Your corn in flowering stage..."
```

## Error Handling Flow

```
┌─────────────────┐
│  Request        │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │ Validation │
    └─────┬──────┘
          │
          ├─ Invalid? ──→ 400 Bad Request
          │               {"error": {"code": "VALIDATION_ERROR", ...}}
          │
          ▼
    ┌────────────┐
    │ Auth Check │
    └─────┬──────┘
          │
          ├─ Not Found? ──→ 404 Not Found
          │                 {"error": {"code": "FIELD_NOT_FOUND", ...}}
          │
          ▼
    ┌────────────┐
    │ Business   │
    │ Logic      │
    └─────┬──────┘
          │
          ├─ Duplicate? ──→ 409 Conflict
          │                 {"error": {"code": "DUPLICATE_FEEDBACK", ...}}
          │
          ├─ Bedrock Fail? ──→ Graceful Degradation
          │                     (Continue with rule-based only)
          │
          ├─ DynamoDB Fail? ──→ 500 Internal Error
          │                      {"error": {"code": "INTERNAL_ERROR", ...}}
          │
          └─ Success ──→ 201 Created
                         {resource object}
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Future)                    │
│                    React + TypeScript                    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      API Layer                           │
│                   AWS API Gateway                        │
│                   (REST API + CORS)                      │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Lambda Proxy
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Compute Layer                          │
│                   AWS Lambda                             │
│                   Node.js 20 Runtime                     │
│                   TypeScript → JavaScript                │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌──────────────────────┐
│    Data Layer         │   │    AI Layer          │
│    AWS DynamoDB       │   │    Amazon Bedrock    │
│    (4 Tables)         │   │    (Claude 3 Haiku)  │
│    On-Demand Billing  │   │    JSON Mode         │
└───────────────────────┘   └──────────────────────┘
```

## Security Model (Current MVP)

```
┌─────────────────────────────────────────────────────────┐
│                    Public Access                         │
│                  (No Authentication)                     │
│                                                          │
│  All requests use hardcoded userId: "demo-user"         │
│                                                          │
│  ⚠️  NOT PRODUCTION READY                               │
│  ⚠️  Cognito integration pending                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway                            │
│                   (CORS Enabled)                         │
│                   (No Authorizer)                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Lambda Execution Role                     │
│                                                          │
│  Permissions:                                            │
│  ✓ DynamoDB: PutItem, GetItem, Query                   │
│  ✓ Bedrock: InvokeModel                                │
│  ✓ CloudWatch: CreateLogGroup, PutLogEvents            │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Developer Machine                      │
│                                                          │
│  1. npm run build (TypeScript → JavaScript)            │
│  2. cdk deploy (Infrastructure as Code)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ AWS CDK
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  AWS CloudFormation                      │
│                                                          │
│  Creates/Updates:                                        │
│  - DynamoDB Tables (4)                                  │
│  - Lambda Functions (4)                                 │
│  - API Gateway (1)                                      │
│  - IAM Roles (1)                                        │
│  - CloudWatch Log Groups (4)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Provisions
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    AWS Resources                         │
│                                                          │
│  Region: us-east-1 (configurable)                       │
│  Stack: RainlineMvpStack                                │
│  Status: CREATE_COMPLETE                                │
└─────────────────────────────────────────────────────────┘
```

## Cost Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cost Breakdown                        │
│                  (Light Testing Usage)                   │
│                                                          │
│  DynamoDB (On-Demand):                                  │
│    - 100 requests/day × 30 days = 3,000 requests       │
│    - Cost: ~$0.01/month                                 │
│                                                          │
│  Lambda:                                                 │
│    - 100 invocations/day × 30 days = 3,000 invocations│
│    - Free tier: 1M requests/month                       │
│    - Cost: $0.00/month                                  │
│                                                          │
│  API Gateway:                                            │
│    - 100 requests/day × 30 days = 3,000 requests       │
│    - Free tier: 1M requests/month                       │
│    - Cost: $0.00/month                                  │
│                                                          │
│  Bedrock (Claude 3 Haiku):                              │
│    - 50 recommendations/day × 30 days = 1,500 calls    │
│    - ~500 tokens/call = 750K tokens                     │
│    - Cost: ~$0.50/month                                 │
│                                                          │
│  Total: < $1/month for testing                          │
└─────────────────────────────────────────────────────────┘
```

## Scalability Architecture

```
Component          Current Limit    Auto-Scales?   Notes
─────────────────────────────────────────────────────────
API Gateway        10,000 req/s     Yes            Regional limit
Lambda             1,000 concurrent Yes            Account limit
DynamoDB           On-demand        Yes            Unlimited
Bedrock            Varies by model  No             Request quota

Bottlenecks:
1. Bedrock API quota (primary concern)
2. Lambda concurrent executions (secondary)
3. DynamoDB throughput (unlikely with on-demand)

Scaling Strategy:
- Bedrock: Request quota increase from AWS
- Lambda: Increase concurrent execution limit
- DynamoDB: Already auto-scales with on-demand
```

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CloudWatch Logs                        │
│                                                          │
│  /aws/lambda/RainlineMvpStack-FarmsHandler             │
│  /aws/lambda/RainlineMvpStack-FieldsHandler            │
│  /aws/lambda/RainlineMvpStack-RecommendationsHandler   │
│  /aws/lambda/RainlineMvpStack-FeedbackHandler          │
│                                                          │
│  Retention: 30 days (configurable)                      │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Logs
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   CloudWatch Metrics                     │
│                                                          │
│  Lambda:                                                 │
│  - Invocations                                          │
│  - Duration                                             │
│  - Errors                                               │
│  - Throttles                                            │
│                                                          │
│  DynamoDB:                                              │
│  - ConsumedReadCapacityUnits                           │
│  - ConsumedWriteCapacityUnits                          │
│  - UserErrors                                           │
│  - SystemErrors                                         │
│                                                          │
│  API Gateway:                                            │
│  - Count (requests)                                     │
│  - 4XXError                                             │
│  - 5XXError                                             │
│  - Latency                                              │
└─────────────────────────────────────────────────────────┘
```

---

This architecture is designed for:
- ✅ Minimal operational overhead (serverless)
- ✅ Cost efficiency (pay-per-use)
- ✅ Automatic scaling
- ✅ High availability (AWS managed services)
- ✅ Easy deployment (Infrastructure as Code)
