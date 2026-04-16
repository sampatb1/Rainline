"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const crypto_1 = require("crypto");
const dynamodb_1 = require("../services/dynamodb");
const response_1 = require("../utils/response");
const validation_1 = require("../utils/validation");
const FARMS_TABLE = process.env.FARMS_TABLE_NAME || 'rainline-farms';
const FIELDS_TABLE = process.env.FIELDS_TABLE_NAME || 'rainline-fields';
const DEMO_USER_ID = 'demo-user';
async function handler(event) {
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
        return (0, response_1.errorResponse)(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
    catch (error) {
        console.error('Fields handler error:', error);
        return (0, response_1.errorResponse)(500, 'INTERNAL_ERROR', 'Internal server error');
    }
}
async function createField(event) {
    const farmId = event.pathParameters?.farmId;
    if (!farmId) {
        return (0, response_1.errorResponse)(400, 'MISSING_FARM_ID', 'Farm ID is required');
    }
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
    const validation = (0, validation_1.validateFieldData)(requestData);
    if (!validation.valid) {
        return (0, response_1.errorResponse)(400, 'VALIDATION_ERROR', validation.error);
    }
    // Verify farm exists and belongs to user
    const farm = await (0, dynamodb_1.getItem)(FARMS_TABLE, {
        userId: DEMO_USER_ID,
        farmId: farmId,
    });
    if (!farm) {
        return (0, response_1.errorResponse)(404, 'FARM_NOT_FOUND', 'Farm not found');
    }
    // Create field object
    const now = new Date().toISOString();
    const field = {
        fieldId: (0, crypto_1.randomUUID)(),
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
    await (0, dynamodb_1.putItem)(FIELDS_TABLE, field);
    console.log('Field created:', field.fieldId);
    return (0, response_1.successResponse)(201, { field });
}
async function listFields(event) {
    const farmId = event.pathParameters?.farmId;
    if (!farmId) {
        return (0, response_1.errorResponse)(400, 'MISSING_FARM_ID', 'Farm ID is required');
    }
    // Query fields by farmId
    const fields = await (0, dynamodb_1.query)(FIELDS_TABLE, 'farmId = :farmId', { ':farmId': farmId });
    console.log('Fields retrieved:', fields.length);
    return (0, response_1.successResponse)(200, { fields });
}
async function deleteField(event) {
    const farmId = event.pathParameters?.farmId;
    const fieldId = event.pathParameters?.fieldId;
    if (!farmId) {
        return (0, response_1.errorResponse)(400, 'MISSING_FARM_ID', 'Farm ID is required');
    }
    if (!fieldId) {
        return (0, response_1.errorResponse)(400, 'MISSING_FIELD_ID', 'Field ID is required');
    }
    // Delete the field
    await (0, dynamodb_1.deleteItem)(FIELDS_TABLE, {
        farmId: farmId,
        fieldId: fieldId,
    });
    console.log('Field deleted:', fieldId);
    return (0, response_1.successResponse)(200, { message: 'Field deleted successfully' });
}
