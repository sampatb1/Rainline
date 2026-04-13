# Rainline MVP - API Examples

Complete examples for testing all 4 endpoints with various scenarios.

## Setup

```bash
# Set your API URL (get from CDK output)
export API_URL="https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod"

# Optional: Install jq for JSON parsing
brew install jq  # macOS
```

## Example 1: Basic Flow

### 1.1 Create a Farm

```bash
curl -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Green Valley Farm",
    "location": "Salinas, California"
  }'
```

**Response:**
```json
{
  "farm": {
    "farmId": "f8e7d6c5-b4a3-2109-8765-4321fedcba98",
    "userId": "demo-user",
    "name": "Green Valley Farm",
    "location": "Salinas, California",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### 1.2 Create a Field

```bash
# Save farm ID from previous response
FARM_ID="f8e7d6c5-b4a3-2109-8765-4321fedcba98"

curl -X POST "$API_URL/farms/$FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "North Field",
    "cropType": "corn",
    "soilType": "loam",
    "area": 10.5
  }'
```

**Response:**
```json
{
  "field": {
    "fieldId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "farmId": "f8e7d6c5-b4a3-2109-8765-4321fedcba98",
    "userId": "demo-user",
    "name": "North Field",
    "cropType": "corn",
    "soilType": "loam",
    "area": 10.5,
    "createdAt": "2024-01-20T10:31:00.000Z",
    "updatedAt": "2024-01-20T10:31:00.000Z"
  }
}
```

### 1.3 Generate Recommendation

```bash
# Save field ID from previous response
FIELD_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
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
```

**Response:**
```json
{
  "recommendation": {
    "recommendationId": "rec-9876-5432-1098-7654",
    "fieldId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": "demo-user",
    "timestamp": "2024-01-20T10:32:00.000Z",
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-15T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 92
    },
    "recommendedInches": 1.44,
    "action": "irrigate_now",
    "timing": "Today",
    "reasoning": {
      "ruleBased": "Your corn in flowering stage needs approximately 1.50 inches per week. It has been 5 days since last irrigation. After accounting for 0.20 inches of recent rainfall and loam soil characteristics, immediate irrigation of 1.44 inches is recommended. High temperature (92°F) increases water demand by 20%.",
      "aiEnhanced": "Given the high temperature and flowering stage, your corn is at peak water demand. The 20% increase accounts for evapotranspiration losses. Consider irrigating early morning to minimize water loss. Watch for signs of heat stress like leaf rolling.",
      "aiAvailable": true
    },
    "createdAt": "2024-01-20T10:32:00.000Z"
  }
}
```

### 1.4 Submit Feedback

```bash
# Save recommendation ID from previous response
REC_ID="rec-9876-5432-1098-7654"

curl -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "worked": true,
    "comment": "The recommendation was very helpful. Corn looks much healthier!"
  }'
```

**Response:**
```json
{
  "feedback": {
    "feedbackId": "fb-1234-5678-9012-3456",
    "recommendationId": "rec-9876-5432-1098-7654",
    "userId": "demo-user",
    "worked": true,
    "comment": "The recommendation was very helpful. Corn looks much healthier!",
    "createdAt": "2024-01-21T08:00:00.000Z"
  }
}
```

## Example 2: Different Crop Types

### 2.1 Wheat in Vegetative Stage

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "wheat",
      "soilType": "clay",
      "growthStage": "vegetative",
      "lastIrrigation": "2024-01-18T00:00:00.000Z",
      "rainfall": 15,
      "temperature": 75
    }
  }'
```

**Expected:** `action: "wait"` (recent rainfall + clay soil retention)

### 2.2 Tomato in Flowering Stage

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "tomato",
      "soilType": "sandy",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-12T00:00:00.000Z",
      "rainfall": 0,
      "temperature": 88
    }
  }'
```

**Expected:** `action: "irrigate_now"` (sandy soil + no rain + 8 days)

### 2.3 Lettuce in Seedling Stage

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "lettuce",
      "soilType": "loam",
      "growthStage": "seedling",
      "lastIrrigation": "2024-01-17T00:00:00.000Z",
      "rainfall": 8,
      "temperature": 70
    }
  }'
```

**Expected:** `action: "wait"` (low water need + recent rain)

## Example 3: Edge Cases

### 3.1 High Temperature Scenario

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "sandy",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-16T00:00:00.000Z",
      "rainfall": 0,
      "temperature": 105
    }
  }'
```

**Expected:** High `recommendedInches` due to:
- Sandy soil (1.2x multiplier)
- No rainfall
- Extreme temperature (1.2x multiplier)
- Flowering stage (high base need)

### 3.2 Heavy Rainfall Scenario

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "wheat",
      "soilType": "clay",
      "growthStage": "vegetative",
      "lastIrrigation": "2024-01-10T00:00:00.000Z",
      "rainfall": 50,
      "temperature": 72
    }
  }'
```

**Expected:** `action: "wait"` (heavy rainfall + clay retention)

### 3.3 Recent Irrigation

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "tomato",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-20T00:00:00.000Z",
      "rainfall": 0,
      "temperature": 85
    }
  }'
```

**Expected:** `action: "wait"` (irrigated today)

## Example 4: Error Scenarios

### 4.1 Missing Required Field

```bash
curl -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "California"
  }'
```

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field \"name\" is required and must be a non-empty string"
  }
}
```

### 4.2 Invalid Field ID

```bash
curl -X POST "$API_URL/fields/invalid-id/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-15T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 85
    }
  }'
```

**Response:**
```json
{
  "error": {
    "code": "FIELD_NOT_FOUND",
    "message": "Field not found"
  }
}
```

### 4.3 Invalid Data Type

```bash
curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-15T00:00:00.000Z",
      "rainfall": "five",
      "temperature": 85
    }
  }'
```

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field \"conditions.rainfall\" is required and must be a non-negative number"
  }
}
```

### 4.4 Duplicate Feedback

```bash
# Submit feedback twice for same recommendation
curl -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked": true}'

# Second attempt
curl -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked": false}'
```

**Response (second attempt):**
```json
{
  "error": {
    "code": "DUPLICATE_FEEDBACK",
    "message": "Feedback already submitted for this recommendation"
  }
}
```

## Example 5: Automated Testing Script

```bash
#!/bin/bash
set -e

API_URL="$1"

if [ -z "$API_URL" ]; then
  echo "Usage: $0 <API_URL>"
  exit 1
fi

echo "🧪 Testing Rainline API"

# Test 1: Create Farm
echo "1️⃣  Creating farm..."
FARM_RESPONSE=$(curl -s -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"CA"}')
FARM_ID=$(echo $FARM_RESPONSE | jq -r '.farm.farmId')
echo "✅ Farm created: $FARM_ID"

# Test 2: Create Field
echo "2️⃣  Creating field..."
FIELD_RESPONSE=$(curl -s -X POST "$API_URL/farms/$FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}')
FIELD_ID=$(echo $FIELD_RESPONSE | jq -r '.field.fieldId')
echo "✅ Field created: $FIELD_ID"

# Test 3: Generate Recommendation
echo "3️⃣  Generating recommendation..."
REC_RESPONSE=$(curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
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
ACTION=$(echo $REC_RESPONSE | jq -r '.recommendation.action')
INCHES=$(echo $REC_RESPONSE | jq -r '.recommendation.recommendedInches')
AI_AVAILABLE=$(echo $REC_RESPONSE | jq -r '.recommendation.reasoning.aiAvailable')
echo "✅ Recommendation: $ACTION, $INCHES inches, AI: $AI_AVAILABLE"

# Test 4: Submit Feedback
echo "4️⃣  Submitting feedback..."
FB_RESPONSE=$(curl -s -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked":true,"comment":"Great!"}')
FB_ID=$(echo $FB_RESPONSE | jq -r '.feedback.feedbackId')
echo "✅ Feedback submitted: $FB_ID"

echo ""
echo "🎉 All tests passed!"
```

## Example 6: Using with jq for Parsing

```bash
# Create farm and extract ID in one line
FARM_ID=$(curl -s -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Farm"}' | jq -r '.farm.farmId')

# Create field and extract ID
FIELD_ID=$(curl -s -X POST "$API_URL/farms/$FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}' | jq -r '.field.fieldId')

# Get recommendation and extract action
ACTION=$(curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2024-01-15T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 85
    }
  }' | jq -r '.recommendation.action')

echo "Recommendation: $ACTION"
```

## Example 7: Pretty Printing Responses

```bash
# Pretty print with jq
curl -s -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pretty Farm"}' | jq '.'

# Extract specific fields
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{...}' | jq '{
    action: .recommendation.action,
    inches: .recommendation.recommendedInches,
    timing: .recommendation.timing,
    aiAvailable: .recommendation.reasoning.aiAvailable
  }'
```

## Example 8: Testing Bedrock Degradation

To test graceful degradation when Bedrock fails:

1. Temporarily disable Bedrock access in IAM
2. Generate a recommendation
3. Verify response has:
   - `reasoning.aiAvailable: false`
   - `reasoning.aiEnhanced: undefined`
   - `reasoning.ruleBased: "..."` (still present)

## Example 9: Load Testing

```bash
# Simple load test (requires GNU parallel)
seq 1 100 | parallel -j 10 \
  "curl -s -X POST '$API_URL/farms' \
   -H 'Content-Type: application/json' \
   -d '{\"name\":\"Farm {}\"}' > /dev/null && echo 'Request {} done'"
```

## Example 10: Monitoring Responses

```bash
# Monitor response times
time curl -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Check HTTP status codes
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/farms` | POST | Create a farm |
| `/farms/{farmId}/fields` | POST | Create a field |
| `/fields/{fieldId}/recommendations` | POST | Generate recommendation |
| `/recommendations/{recId}/feedback` | POST | Submit feedback |

## Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Validation error, missing field |
| 404 | Not Found | Farm/field doesn't exist |
| 409 | Conflict | Duplicate feedback |
| 500 | Internal Error | Server error, check logs |

## Tips

1. **Save IDs**: Always save resource IDs for subsequent requests
2. **Use jq**: Parse JSON responses easily
3. **Check logs**: CloudWatch logs show detailed errors
4. **Test edge cases**: Try extreme values to verify rule engine
5. **Monitor AI**: Check `aiAvailable` flag in responses
