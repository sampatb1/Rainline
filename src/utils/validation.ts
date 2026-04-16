import { CreateFarmRequest, CreateFieldRequest, CreateRecommendationRequest, CreateFeedbackRequest } from '../types';

export function validateFarmData(data: any): { valid: boolean; error?: string } {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return { valid: false, error: 'Field "name" is required and must be a non-empty string' };
  }

  if (data.location !== undefined && typeof data.location !== 'string') {
    return { valid: false, error: 'Field "location" must be a string' };
  }

  return { valid: true };
}

export function validateFieldData(data: any): { valid: boolean; error?: string } {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return { valid: false, error: 'Field "name" is required and must be a non-empty string' };
  }

  if (!data.cropType || typeof data.cropType !== 'string' || data.cropType.trim() === '') {
    return { valid: false, error: 'Field "cropType" is required and must be a non-empty string' };
  }

  if (!data.soilType || typeof data.soilType !== 'string' || data.soilType.trim() === '') {
    return { valid: false, error: 'Field "soilType" is required and must be a non-empty string' };
  }

  if (data.area !== undefined && (typeof data.area !== 'number' || data.area <= 0)) {
    return { valid: false, error: 'Field "area" must be a positive number' };
  }

  return { valid: true };
}

export function validateFieldConditions(data: any): { valid: boolean; error?: string } {
  const conditions = data.conditions;

  if (!conditions) {
    return { valid: false, error: 'Field "conditions" is required' };
  }

  if (!conditions.cropType || typeof conditions.cropType !== 'string') {
    return { valid: false, error: 'Field "conditions.cropType" is required and must be a string' };
  }

  if (!conditions.soilType || typeof conditions.soilType !== 'string') {
    return { valid: false, error: 'Field "conditions.soilType" is required and must be a string' };
  }

  if (!conditions.growthStage || typeof conditions.growthStage !== 'string') {
    return { valid: false, error: 'Field "conditions.growthStage" is required and must be a string' };
  }

  if (!conditions.lastIrrigation || typeof conditions.lastIrrigation !== 'string') {
    return { valid: false, error: 'Field "conditions.lastIrrigation" is required and must be a string' };
  }

  if (typeof conditions.rainfall !== 'number' || conditions.rainfall < 0) {
    return { valid: false, error: 'Field "conditions.rainfall" is required and must be a non-negative number' };
  }

  if (typeof conditions.temperature !== 'number') {
    return { valid: false, error: 'Field "conditions.temperature" is required and must be a number' };
  }

  return { valid: true };
}

export function validateFeedbackData(data: any): { valid: boolean; error?: string } {
  if (typeof data.worked !== 'boolean') {
    return { valid: false, error: 'Field "worked" is required and must be a boolean' };
  }

  if (data.comment !== undefined && typeof data.comment !== 'string') {
    return { valid: false, error: 'Field "comment" must be a string' };
  }

  return { valid: true };
}
