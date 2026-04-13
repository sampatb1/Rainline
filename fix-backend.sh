#!/bin/bash
set -e

echo "Fixing backend code..."

# Fix 1: Update dynamodb.ts to support GSI queries
cat > backend/src/services/dynamodb.ts << 'EOF'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function putItem(tableName: string, item: any): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
  } catch (error) {
    console.error('DynamoDB putItem error:', error);
    throw new Error('Failed to store data');
  }
}

export async function getItem(tableName: string, key: any): Promise<any | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      })
    );
    return result.Item || null;
  } catch (error) {
    console.error('DynamoDB getItem error:', error);
    throw new Error('Failed to retrieve data');
  }
}

export async function query(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: any,
  expressionAttributeNames?: any,
  indexName?: string,
  limit?: number
): Promise<any[]> {
  try {
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    if (indexName) {
      params.IndexName = indexName;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('DynamoDB query error:', error);
    throw new Error('Failed to query data');
  }
}

export async function deleteItem(tableName: string, key: any): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
      })
    );
  } catch (error) {
    console.error('DynamoDB deleteItem error:', error);
    throw new Error('Failed to delete data');
  }
}

export async function batchDelete(tableName: string, keys: any[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    const deleteRequests = keys.map((key) => ({
      DeleteRequest: { Key: key },
    }));

    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch,
          },
        })
      );
    }
  } catch (error) {
    console.error('DynamoDB batchDelete error:', error);
    throw new Error('Failed to batch delete data');
  }
}
EOF

# Fix 2: Update recommendations.ts to use GSI
cat > backend/src/handlers/recommendations.ts << 'EOF'
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
    if (event.httpMethod === 'POST') {
      return await createRecommendation(event);
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
EOF

# Fix 3: Replace uuid with crypto in feedback.ts
sed -i '' "s/import { v4 as uuidv4 } from 'uuid';/import { randomUUID } from 'crypto';/" backend/src/handlers/feedback.ts
sed -i '' "s/uuidv4()/randomUUID()/" backend/src/handlers/feedback.ts

echo "✅ Code fixes applied!"
echo ""
echo "Now rebuild and redeploy:"
echo "cd backend && rm -rf dist && npm run build && cd .."
echo "cd infrastructure && cdk deploy && cd .."
