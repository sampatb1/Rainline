import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { FieldConditions } from '../types';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface BedrockEnhancedResult {
  recommendedInches: number;
  action: 'irrigate_now' | 'irrigate_soon' | 'wait';
  timing: string;
  aiReasoning: string;
  riskWarning: string;
  followUpQuestions: string[];
}

interface RuleBasedRecommendation {
  recommendedInches: number;
  action: 'irrigate_now' | 'irrigate_soon' | 'wait';
  timing: string;
  ruleReasoning: string;
}

export async function enhanceRecommendation(
  conditions: FieldConditions,
  ruleBasedRec: RuleBasedRecommendation
): Promise<BedrockEnhancedResult | null> {
  try {
    const prompt = buildPrompt(conditions, ruleBasedRec);
    
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
    
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    // Set timeout to 15 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Bedrock timeout after 15s')), 15000);
    });

    const response = await Promise.race([client.send(command), timeoutPromise]);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;

    // Parse the JSON response
    const result = parseBedrockResponse(content);
    
    return result;
  } catch (error) {
    console.error('Bedrock enhancement failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
      region: process.env.AWS_REGION || 'us-east-1'
    });
    return null;
  }
}

function buildPrompt(conditions: FieldConditions, ruleBasedRec: RuleBasedRecommendation): string {
  return `You are an agricultural advisor helping farmers with irrigation decisions.

Field Conditions:
- Crop: ${conditions.cropType}
- Soil: ${conditions.soilType}
- Growth Stage: ${conditions.growthStage}
- Last Irrigation: ${conditions.lastIrrigation}
- Recent Rainfall: ${conditions.rainfall}mm
- Temperature: ${conditions.temperature}°F

Rule-Based Recommendation:
- Action: ${ruleBasedRec.action}
- Amount: ${ruleBasedRec.recommendedInches} inches
- Timing: ${ruleBasedRec.timing}
- Reasoning: ${ruleBasedRec.ruleReasoning}

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no commentary.

Return EXACTLY this JSON structure:
{
  "recommendedInches": ${ruleBasedRec.recommendedInches},
  "action": "${ruleBasedRec.action}",
  "timing": "${ruleBasedRec.timing}",
  "aiReasoning": "Enhanced explanation for the farmer in 2-3 sentences",
  "riskWarning": "Any risks or factors to watch (1-2 sentences, or empty string if none)",
  "followUpQuestions": ["Question 1?", "Question 2?"]
}

Provide:
1. aiReasoning: Enhanced, farmer-friendly explanation (2-3 sentences)
2. riskWarning: Important risks or considerations (1-2 sentences, or "" if none)
3. followUpQuestions: 2-3 relevant questions the farmer should consider (array of strings)

Remember: Output ONLY the JSON object. No other text.`;
}

function parseBedrockResponse(content: string): BedrockEnhancedResult {
  // Remove any markdown code blocks if present
  let cleaned = content.trim();
  cleaned = cleaned.replace(/```json\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields
    if (
      typeof parsed.recommendedInches !== 'number' ||
      !['irrigate_now', 'irrigate_soon', 'wait'].includes(parsed.action) ||
      typeof parsed.timing !== 'string' ||
      typeof parsed.aiReasoning !== 'string' ||
      typeof parsed.riskWarning !== 'string' ||
      !Array.isArray(parsed.followUpQuestions)
    ) {
      throw new Error('Invalid response structure');
    }

    return parsed as BedrockEnhancedResult;
  } catch (error) {
    console.error('Failed to parse Bedrock response:', error);
    console.error('Raw content:', content);
    throw new Error('Invalid JSON response from Bedrock');
  }
}
