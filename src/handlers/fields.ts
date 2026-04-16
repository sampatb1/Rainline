import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { putItem, getItem, query, deleteItem } from '../services/dynamodb';
import { Field, CreateFieldRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { validateFieldData } from '../utils/validation';

const FARMS_TABLE = process.env.FARMS_TABLE_NAME || 'rainline-farms';
const FIELDS_TABLE = process.env.FIELDS_TABLE_NAME || 'rainline-fields';
const DEMO_USER_ID = 'demo-user';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Fields handler invoked:', event.httpMethod, event.path);

  try {
    if (event.httpMethod === 'GET') {
      return await listFields(event);
    }

    if (event.httpMethod === 'POST') {
      return await createField(event);
    }

    if (event.httpMethod === 'DELETE') {
      return await deleteField(event);
    }

    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  } catch (error) {
    console.error('Fields handler error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

async function createField(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const farmId = event.pathParameters?.farmId;
  if (!farmId) {
    return errorResponse(400, 'MISSING_FARM_ID', 'Farm ID is required');
  }

  if (!event.body) {
    return errorResponse(400, 'MISSING_BODY', 'Request body is required');
  }

  let requestData: CreateFieldRequest;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Validate input
  const validation = validateFieldData(requestData);
  if (!validation.valid) {
    return errorResponse(400, 'VALIDATION_ERROR', validation.error!);
  }

  // Verify farm exists and belongs to user
  const farm = await getItem(FARMS_TABLE, {
    userId: DEMO_USER_ID,
    farmId: farmId,
  });

  if (!farm) {
    return errorResponse(404, 'FARM_NOT_FOUND', 'Farm not found');
  }

  // Create field object
  const now = new Date().toISOString();
  const field: Field = {
    fieldId: randomUUID(),
    farmId: farmId,
    userId: DEMO_USER_ID,
    name: requestData.name.trim(),
    cropType: requestData.cropType.trim(),
    soilType: requestData.soilType.trim(),
    area: requestData.area,
    createdAt: now,
    updatedAt: now,
  };

  // Store in DynamoDB
  await putItem(FIELDS_TABLE, field);

  console.log('Field created:', field.fieldId);

  return successResponse(201, { field });
}

async function listFields(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const farmId = event.pathParameters?.farmId;
  if (!farmId) {
    return errorResponse(400, 'MISSING_FARM_ID', 'Farm ID is required');
  }

  // Query fields by farmId
  const fields = await query(
    FIELDS_TABLE,
    'farmId = :farmId',
    { ':farmId': farmId }
  );

  console.log('Fields retrieved:', fields.length);

  return successResponse(200, { fields });
}

async function deleteField(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const farmId = event.pathParameters?.farmId;
  const fieldId = event.pathParameters?.fieldId;
  
  if (!farmId) {
    return errorResponse(400, 'MISSING_FARM_ID', 'Farm ID is required');
  }
  
  if (!fieldId) {
    return errorResponse(400, 'MISSING_FIELD_ID', 'Field ID is required');
  }

  // Delete the field
  await deleteItem(FIELDS_TABLE, {
    farmId: farmId,
    fieldId: fieldId,
  });

  console.log('Field deleted:', fieldId);

  return successResponse(200, { message: 'Field deleted successfully' });
}
