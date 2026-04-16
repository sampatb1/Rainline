"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putItem = putItem;
exports.getItem = getItem;
exports.query = query;
exports.deleteItem = deleteItem;
exports.batchDelete = batchDelete;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});
async function putItem(tableName, item) {
    try {
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: tableName,
            Item: item,
        }));
    }
    catch (error) {
        console.error('DynamoDB putItem error:', error);
        throw new Error('Failed to store data');
    }
}
async function getItem(tableName, key) {
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: tableName,
            Key: key,
        }));
        return result.Item || null;
    }
    catch (error) {
        console.error('DynamoDB getItem error:', error);
        throw new Error('Failed to retrieve data');
    }
}
async function query(tableName, keyConditionExpression, expressionAttributeValues, expressionAttributeNames, indexName, limit) {
    try {
        const params = {
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
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand(params));
        return result.Items || [];
    }
    catch (error) {
        console.error('DynamoDB query error:', error);
        throw new Error('Failed to query data');
    }
}
async function deleteItem(tableName, key) {
    try {
        await docClient.send(new lib_dynamodb_1.DeleteCommand({
            TableName: tableName,
            Key: key,
        }));
    }
    catch (error) {
        console.error('DynamoDB deleteItem error:', error);
        throw new Error('Failed to delete data');
    }
}
async function batchDelete(tableName, keys) {
    if (keys.length === 0)
        return;
    try {
        const deleteRequests = keys.map((key) => ({
            DeleteRequest: { Key: key },
        }));
        for (let i = 0; i < deleteRequests.length; i += 25) {
            const batch = deleteRequests.slice(i, i + 25);
            await docClient.send(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [tableName]: batch,
                },
            }));
        }
    }
    catch (error) {
        console.error('DynamoDB batchDelete error:', error);
        throw new Error('Failed to batch delete data');
    }
}
