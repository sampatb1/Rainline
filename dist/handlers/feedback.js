"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const crypto_1 = require("crypto");
const dynamodb_1 = require("../services/dynamodb");
const response_1 = require("../utils/response");
const validation_1 = require("../utils/validation");
const RECOMMENDATIONS_TABLE = process.env.RECOMMENDATIONS_TABLE_NAME || 'rainline-recommendations';
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE_NAME || 'rainline-feedback';
const DEMO_USER_ID = 'demo-user';
async function handler(event) {
    console.log('Feedback handler invoked:', event.httpMethod, event.path);
    try {
        if (event.httpMethod === 'POST') {
            return await createFeedback(event);
        }
        return (0, response_1.errorResponse)(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
    catch (error) {
        console.error('Feedback handler error:', error);
        return (0, response_1.errorResponse)(500, 'INTERNAL_ERROR', 'Internal server error');
    }
}
async function createFeedback(event) {
    const recommendationId = event.pathParameters?.recommendationId;
    if (!recommendationId) {
        return (0, response_1.errorResponse)(400, 'MISSING_RECOMMENDATION_ID', 'Recommendation ID is required');
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
    const validation = (0, validation_1.validateFeedbackData)(requestData);
    if (!validation.valid) {
        return (0, response_1.errorResponse)(400, 'VALIDATION_ERROR', validation.error);
    }
    // Check for duplicate feedback
    const existingFeedback = await (0, dynamodb_1.getItem)(FEEDBACK_TABLE, {
        recommendationId: recommendationId,
        userId: DEMO_USER_ID,
    });
    if (existingFeedback) {
        return (0, response_1.errorResponse)(409, 'DUPLICATE_FEEDBACK', 'Feedback already submitted for this recommendation');
    }
    // Create feedback object
    const now = new Date().toISOString();
    const feedback = {
        feedbackId: (0, crypto_1.randomUUID)(),
        recommendationId: recommendationId,
        userId: DEMO_USER_ID,
        worked: requestData.worked,
        comment: requestData.comment?.trim(),
        createdAt: now,
    };
    // Store in DynamoDB
    await (0, dynamodb_1.putItem)(FEEDBACK_TABLE, feedback);
    console.log('Feedback created:', feedback.feedbackId);
    return (0, response_1.successResponse)(201, { feedback });
}
