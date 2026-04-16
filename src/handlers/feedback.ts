import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { putItem, getItem } from '../services/dynamodb';
import { Feedback, CreateFeedbackRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { validateFeedbackData } from '../utils/validation';

const RECOMMENDATIONS_TABLE = process.env.RECOMMENDATIONS_TABLE_NAME || 'rainline-recommendations';
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE_NAME || 'rainline-feedback';
const DEMO_USER_ID = 'demo-user';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Feedback handler invoked:', event.httpMethod, event.path);

  try {
    if (event.httpMethod === 'POST') {
      return await createFeedback(event);
    }

    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  } catch (error) {
    console.error('Feedback handler error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

async function createFeedback(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const recommendationId = event.pathParameters?.recommendationId;
  if (!recommendationId) {
    return errorResponse(400, 'MISSING_RECOMMENDATION_ID', 'Recommendation ID is required');
  }

  if (!event.body) {
    return errorResponse(400, 'MISSING_BODY', 'Request body is required');
  }

  let requestData: CreateFeedbackRequest;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Validate input
  const validation = validateFeedbackData(requestData);
  if (!validation.valid) {
    return errorResponse(400, 'VALIDATION_ERROR', validation.error!);
  }

  // Check for duplicate feedback
  const existingFeedback = await getItem(FEEDBACK_TABLE, {
    recommendationId: recommendationId,
    userId: DEMO_USER_ID,
  });

  if (existingFeedback) {
    return errorResponse(409, 'DUPLICATE_FEEDBACK', 'Feedback already submitted for this recommendation');
  }

  // Create feedback object
  const now = new Date().toISOString();
  const feedback: Feedback = {
    feedbackId: randomUUID(),
    recommendationId: recommendationId,
    userId: DEMO_USER_ID,
    worked: requestData.worked,
    comment: requestData.comment?.trim(),
    createdAt: now,
  };

  // Store in DynamoDB
  await putItem(FEEDBACK_TABLE, feedback);

  console.log('Feedback created:', feedback.feedbackId);

  return successResponse(201, { feedback });
}
