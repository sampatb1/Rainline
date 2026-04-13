#!/bin/bash

API_URL="https://tdyha1d3rf.execute-api.us-east-1.amazonaws.com/prod"
FIELD_ID="test-field-123"

echo "🌱 Testing Crop Type and Soil Type Differences"
echo "=============================================="
echo ""

# Test 1: Rice vs Lettuce (High water vs Low water crops)
echo "📊 Test 1: Rice vs Lettuce (Same conditions, different crops)"
echo "-----------------------------------------------------------"

echo "🌾 Rice + Sandy Soil + Flowering Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "rice",
      "soilType": "sandy", 
      "growthStage": "flowering",
      "lastIrrigation": "2026-02-24T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "🥬 Lettuce + Sandy Soil + Flowering Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "lettuce",
      "soilType": "sandy",
      "growthStage": "flowering", 
      "lastIrrigation": "2026-02-24T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "=============================================="
echo ""

# Test 2: Sandy vs Clay soil (Same crop, different soil)
echo "📊 Test 2: Sandy vs Clay Soil (Same crop, different soil)"
echo "---------------------------------------------------------"

echo "🏖️ Corn + Sandy Soil + Flowering Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "sandy",
      "growthStage": "flowering",
      "lastIrrigation": "2026-02-24T00:00:00.000Z", 
      "rainfall": 5,
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "🧱 Corn + Clay Soil + Flowering Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "clay",
      "growthStage": "flowering",
      "lastIrrigation": "2026-02-24T00:00:00.000Z",
      "rainfall": 5, 
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "=============================================="
echo ""

# Test 3: Growth stages (Same crop, different stages)
echo "📊 Test 3: Growth Stages (Corn at different stages)"
echo "---------------------------------------------------"

echo "🌱 Corn Seedling Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn",
      "soilType": "loam",
      "growthStage": "seedling",
      "lastIrrigation": "2026-02-24T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "🌸 Corn Flowering Stage:"
curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "cropType": "corn", 
      "soilType": "loam",
      "growthStage": "flowering",
      "lastIrrigation": "2026-02-24T00:00:00.000Z",
      "rainfall": 5,
      "temperature": 25
    }
  }' | jq -r '.recommendation.reasoning.ruleBased'

echo ""
echo "✅ Test Complete! You can see the differences in water requirements."