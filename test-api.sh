#!/bin/bash
# Test script for Rainline MVP API
# Usage: ./test-api.sh <API_URL>

if [ -z "$1" ]; then
  echo "Usage: ./test-api.sh <API_URL>"
  echo "Example: ./test-api.sh https://abc123.execute-api.us-east-1.amazonaws.com/prod"
  exit 1
fi

API_URL=$1

echo "🧪 Testing Rainline MVP API"
echo "API URL: $API_URL"
echo ""

# Test 1: Create Farm
echo "1️⃣  Creating farm..."
FARM_RESPONSE=$(curl -s -X POST "$API_URL/farms" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"California"}')

echo "Response: $FARM_RESPONSE"
FARM_ID=$(echo $FARM_RESPONSE | jq -r '.farm.farmId')
echo "Farm ID: $FARM_ID"
echo ""

# Test 2: Create Field
echo "2️⃣  Creating field..."
FIELD_RESPONSE=$(curl -s -X POST "$API_URL/farms/$FARM_ID/fields" \
  -H "Content-Type: application/json" \
  -d '{"name":"North Field","cropType":"corn","soilType":"loam","area":10}')

echo "Response: $FIELD_RESPONSE"
FIELD_ID=$(echo $FIELD_RESPONSE | jq -r '.field.fieldId')
echo "Field ID: $FIELD_ID"
echo ""

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

echo "Response: $REC_RESPONSE"
REC_ID=$(echo $REC_RESPONSE | jq -r '.recommendation.recommendationId')
echo "Recommendation ID: $REC_ID"
echo ""

# Test 4: Submit Feedback
echo "4️⃣  Submitting feedback..."
FEEDBACK_RESPONSE=$(curl -s -X POST "$API_URL/recommendations/$REC_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{"worked":true,"comment":"Great recommendation!"}')

echo "Response: $FEEDBACK_RESPONSE"
echo ""

echo "✅ All tests completed!"
