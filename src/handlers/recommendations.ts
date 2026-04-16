import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { putItem, getItem, query } from '../services/dynamodb';
import { Recommendation, CreateRecommendationRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { validateFieldConditions } from '../utils/validation';
import { generateRecommendation } from '../services/ruleEngine';
import { enhanceRecommendation } from '../services/bedrock';

const FIELDS_TABLE = process.env.FIELDS_TABLE_NAME || 'rainline-fields';
const RECOMMENDATIONS_TABLE = process.env.RECOMMENDATIONS_TABLE_NAME || 'rainline-recommendations';
const DEMO_USER_ID = 'demo-user';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Recommendations handler invoked:', event.httpMethod, event.path);

  try {
    // Check if this is a completion request
    if (event.httpMethod === 'POST' && event.path.includes('/complete')) {
      return await completeRecommendation(event);
    }

    if (event.httpMethod === 'POST') {
      return await createRecommendation(event);
    }

    if (event.httpMethod === 'GET') {
      return await getRecommendations(event);
    }

    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  } catch (error) {
    console.error('Recommendations handler error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

async function createRecommendation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const fieldId = event.pathParameters?.fieldId;
  if (!fieldId) {
    return errorResponse(400, 'MISSING_FIELD_ID', 'Field ID is required');
  }

  if (!event.body) {
    return errorResponse(400, 'MISSING_BODY', 'Request body is required');
  }

  let requestData: CreateRecommendationRequest;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  const validation = validateFieldConditions(requestData);
  if (!validation.valid) {
    return errorResponse(400, 'VALIDATION_ERROR', validation.error!);
  }

  // Verify field exists and belongs to user - use GSI to find field by fieldId
  const fields = await query(
    FIELDS_TABLE,
    'userId = :u AND fieldId = :f',
    { ':u': DEMO_USER_ID, ':f': fieldId },
    undefined,
    'UserFieldsIndex',
    1
  );
  
  if (fields.length === 0) {
    return errorResponse(404, 'FIELD_NOT_FOUND', 'Field not found');
  }

  const ruleBasedRec = generateRecommendation(requestData.conditions);

  let aiEnhanced: string | undefined;
  let aiAvailable = false;

  const bedrockResult = await enhanceRecommendation(requestData.conditions, ruleBasedRec);
  if (bedrockResult) {
    aiAvailable = true;
    aiEnhanced = bedrockResult.aiReasoning;
    if (bedrockResult.riskWarning) {
      aiEnhanced += ` ${bedrockResult.riskWarning}`;
    }
  }

  const now = new Date().toISOString();
  const recommendation: Recommendation = {
    recommendationId: randomUUID(),
    fieldId: fieldId,
    userId: DEMO_USER_ID,
    timestamp: now,
    conditions: requestData.conditions,
    recommendedInches: ruleBasedRec.recommendedInches,
    action: ruleBasedRec.action,
    timing: ruleBasedRec.timing,
    reasoning: {
      ruleBased: ruleBasedRec.ruleReasoning,
      aiEnhanced,
      aiAvailable,
    },
    createdAt: now,
  };

  await putItem(RECOMMENDATIONS_TABLE, recommendation);

  console.log('Recommendation created:', recommendation.recommendationId);

  return successResponse(201, { recommendation });
}

async function getRecommendations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const fieldId = event.pathParameters?.fieldId;
  if (!fieldId) {
    return errorResponse(400, 'MISSING_FIELD_ID', 'Field ID is required');
  }

  // Query recommendations by fieldId, sorted by timestamp (most recent first)
  const recommendations = await query(
    RECOMMENDATIONS_TABLE,
    'fieldId = :f',
    { ':f': fieldId }
  );

  // Sort by timestamp descending (most recent first)
  recommendations.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  console.log('Recommendations retrieved:', recommendations.length);

  return successResponse(200, { 
    recommendations,
    latestRecommendation: recommendations.length > 0 ? recommendations[0] : null
  });
}

async function completeRecommendation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const recommendationId = event.pathParameters?.recommendationId;
  if (!recommendationId) {
    return errorResponse(400, 'MISSING_RECOMMENDATION_ID', 'Recommendation ID is required');
  }

  if (!event.body) {
    return errorResponse(400, 'MISSING_BODY', 'Request body is required');
  }

  let requestData: any;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Query using the GSI to find recommendation by recommendationId
  const recommendations = await query(
    RECOMMENDATIONS_TABLE,
    'recommendationId = :r',
    { ':r': recommendationId },
    undefined, // expressionAttributeNames
    'RecommendationIdIndex' // indexName
  );

  if (recommendations.length === 0) {
    return errorResponse(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
  }

  const recommendation = recommendations[0] as Recommendation;

  // Update with completion data
  const updatedRecommendation: Recommendation = {
    ...recommendation,
    completed: true,
    completedAt: requestData.completedAt || new Date().toISOString(),
    completionAction: requestData.action,
    actualAmount: requestData.actualAmount,
    completionNotes: requestData.notes,
  };

  await putItem(RECOMMENDATIONS_TABLE, updatedRecommendation);

  console.log('Recommendation marked as completed:', recommendationId);

  return successResponse(200, { recommendation: updatedRecommendation });
}
