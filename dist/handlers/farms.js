"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const crypto_1 = require("crypto");
const dynamodb_1 = require("../services/dynamodb");
const response_1 = require("../utils/response");
const validation_1 = require("../utils/validation");
const FARMS_TABLE = process.env.FARMS_TABLE_NAME || 'rainline-farms';
const DEMO_USER_ID = 'demo-user';
async function handler(event) {
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
        return (0, response_1.errorResponse)(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
    catch (error) {
        console.error('Farms handler error:', error);
        return (0, response_1.errorResponse)(500, 'INTERNAL_ERROR', 'Internal server error');
    }
}
async function createFarm(event) {
    if (!event.body) {
        return (0, response_1.errorResponse)(400, 'MISSING_BODY', 'Request body is required');
    }
    let requestData;
    try {
        requestData = JSON.parse(event.body);
    }
    catch (error) {
        return (0, response_1.errorResponse)(400, 'INVALID_JSON', 'Invalid JSON in request body');
    }
    // Validate input
    const validation = (0, validation_1.validateFarmData)(requestData);
    if (!validation.valid) {
        return (0, response_1.errorResponse)(400, 'VALIDATION_ERROR', validation.error);
    }
    // Create farm object
    const now = new Date().toISOString();
    const farm = {
        farmId: (0, crypto_1.randomUUID)(),
        userId: DEMO_USER_ID,
        name: requestData.name.trim(),
        location: requestData.location?.trim(),
        createdAt: now,
        updatedAt: now,
    };
    // Store in DynamoDB
    await (0, dynamodb_1.putItem)(FARMS_TABLE, farm);
    console.log('Farm created:', farm.farmId);
    return (0, response_1.successResponse)(201, { farm });
}
async function listFarms(event) {
    // Query farms by userId
    const farms = await (0, dynamodb_1.query)(FARMS_TABLE, 'userId = :userId', { ':userId': DEMO_USER_ID });
    console.log('Farms retrieved:', farms.length);
    return (0, response_1.successResponse)(200, { farms });
}
async function deleteFarm(event) {
    const farmId = event.pathParameters?.farmId;
    if (!farmId) {
        return (0, response_1.errorResponse)(400, 'MISSING_FARM_ID', 'Farm ID is required');
    }
    // Delete the farm
    await (0, dynamodb_1.deleteItem)(FARMS_TABLE, {
        userId: DEMO_USER_ID,
        farmId: farmId,
    });
    console.log('Farm deleted:', farmId);
    return (0, response_1.successResponse)(200, { message: 'Farm deleted successfully' });
}
