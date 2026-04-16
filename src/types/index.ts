// Core domain types
export interface Farm {
  farmId: string;
  userId: string;
  name: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  fieldId: string;
  farmId: string;
  userId: string;
  name: string;
  cropType: string;
  soilType: string;
  area?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldConditions {
  cropType: string;
  soilType: string;
  growthStage: string;
  lastIrrigation: string;
  rainfall: number;
  temperature: number;
}

export interface Recommendation {
  recommendationId: string;
  fieldId: string;
  userId: string;
  timestamp: string;
  conditions: FieldConditions;
  recommendedInches: number;
  action: 'irrigate_now' | 'irrigate_soon' | 'wait';
  timing: string;
  reasoning: {
    ruleBased: string;
    aiEnhanced?: string;
    aiAvailable: boolean;
  };
  createdAt: string;
  // Completion tracking
  completed?: boolean;
  completedAt?: string;
  actualAmount?: number;
  completionNotes?: string;
  completionAction?: 'completed' | 'skipped' | 'custom';
}

export interface Feedback {
  feedbackId: string;
  recommendationId: string;
  userId: string;
  worked: boolean;
  comment?: string;
  createdAt: string;
}

// API types
export interface CreateFarmRequest {
  name: string;
  location?: string;
}

export interface CreateFieldRequest {
  name: string;
  cropType: string;
  soilType: string;
  area?: number;
}

export interface CreateRecommendationRequest {
  conditions: FieldConditions;
}

export interface CreateFeedbackRequest {
  worked: boolean;
  comment?: string;
}

export interface CompleteRecommendationRequest {
  action: 'completed' | 'skipped' | 'custom';
  actualAmount?: number;
  notes?: string;
  completedAt: string;
}

// Error types
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
