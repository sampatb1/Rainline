import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { putItem, query, deleteItem } from '../services/dynamodb';
import { Farm, CreateFarmRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { validateFarmData } from '../utils/validation';

const FARMS_TABLE = process.env.FARMS_TABLE_NAME || 'rainline-farms';
const DEMO_USER_ID = 'demo-user';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Farms handler invoked:', event.httpMethod, event.path);

  try {
    if (event.httpMethod === 'GET') {
      return await listFarms(event);
    }

    if (event.httpMethod === 'POST') {
      return await createFarm(event);
    }

    if (event.httpMethod === 'DELETE') {
      return await deleteFarm(event);
    }

    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  } catch (error) {
    console.error('Farms handler error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

async function createFarm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse(400, 'MISSING_BODY', 'Request body is required');
  }

  let requestData: CreateFarmRequest;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return errorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Validate input
  const validation = validateFarmData(requestData);
  if (!validation.valid) {
    return errorResponse(400, 'VALIDATION_ERROR', validation.error!);
  }

  // Create farm object
  const now = new Date().toISOString();
  const farm: Farm = {
    farmId: randomUUID(),
    userId: DEMO_USER_ID,
    name: requestData.name.trim(),
    location: requestData.location?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  // Store in DynamoDB
  await putItem(FARMS_TABLE, farm);

  console.log('Farm created:', farm.farmId);

  return successResponse(201, { farm });
}

async function listFarms(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Query farms by userId
  const farms = await query(
    FARMS_TABLE,
    'userId = :userId',
    { ':userId': DEMO_USER_ID }
  );

  console.log('Farms retrieved:', farms.length);

  return successResponse(200, { farms });
}

async function deleteFarm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const farmId = event.pathParameters?.farmId;
  if (!farmId) {
    return errorResponse(400, 'MISSING_FARM_ID', 'Farm ID is required');
  }

  // Delete the farm
  await deleteItem(FARMS_TABLE, {
    userId: DEMO_USER_ID,
    farmId: farmId,
  });

  console.log('Farm deleted:', farmId);

  return successResponse(200, { message: 'Farm deleted successfully' });
}
