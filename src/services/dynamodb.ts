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
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

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
