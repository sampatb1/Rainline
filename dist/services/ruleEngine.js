"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendation = generateRecommendation;
// Water requirements in inches per week by crop type and growth stage
const WATER_REQUIREMENTS = {
    // Grains
    corn: {
        seedling: 0.5,
        vegetative: 1.0,
        flowering: 1.5,
        maturity: 0.8,
    },
    wheat: {
        seedling: 0.4,
        vegetative: 0.8,
        flowering: 1.2,
        maturity: 0.6,
    },
    rice: {
        seedling: 1.5,
        vegetative: 2.0,
        flowering: 2.5,
        maturity: 1.5,
    },
    // Vegetables
    tomato: {
        seedling: 0.6,
        vegetative: 1.0,
        flowering: 1.5,
        maturity: 1.2,
    },
    lettuce: {
        seedling: 0.5,
        vegetative: 0.8,
        flowering: 0.8,
        maturity: 0.7,
    },
    potato: {
        seedling: 0.5,
        vegetative: 1.2,
        flowering: 1.5,
        maturity: 1.0,
    },
    carrot: {
        seedling: 0.4,
        vegetative: 0.7,
        flowering: 0.9,
        maturity: 0.6,
    },
    onion: {
        seedling: 0.4,
        vegetative: 0.8,
        flowering: 1.0,
        maturity: 0.6,
    },
    // Legumes
    soybean: {
        seedling: 0.4,
        vegetative: 0.9,
        flowering: 1.4,
        maturity: 0.7,
    },
    bean: {
        seedling: 0.5,
        vegetative: 0.9,
        flowering: 1.3,
        maturity: 0.8,
    },
    // Cash crops
    cotton: {
        seedling: 0.5,
        vegetative: 1.0,
        flowering: 1.6,
        maturity: 0.9,
    },
    default: {
        seedling: 0.5,
        vegetative: 1.0,
        flowering: 1.3,
        maturity: 0.8,
    },
};
// Soil type adjustment factors
const SOIL_FACTORS = {
    sandy: 1.2, // Sandy soil drains quickly, needs more water
    loam: 1.0, // Ideal soil
    clay: 0.9, // Clay retains water longer
    default: 1.0,
};
function getWaterRequirement(cropType, growthStage) {
    const crop = WATER_REQUIREMENTS[cropType.toLowerCase()] || WATER_REQUIREMENTS.default;
    return crop[growthStage.toLowerCase()] || crop.vegetative;
}
function getSoilFactor(soilType) {
    return SOIL_FACTORS[soilType.toLowerCase()] || SOIL_FACTORS.default;
}
function getDaysSinceIrrigation(lastIrrigation) {
    const lastDate = new Date(lastIrrigation);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
function generateRecommendation(conditions) {
    // Step 1: Get base water requirement
    const baseRequirement = getWaterRequirement(conditions.cropType, conditions.growthStage);
    // Step 2: Adjust for soil type
    const soilFactor = getSoilFactor(conditions.soilType);
    let adjustedRequirement = baseRequirement * soilFactor;
    // Step 3: Subtract recent rainfall (convert mm to inches: 1 inch = 25.4 mm)
    const rainfallInches = conditions.rainfall / 25.4;
    adjustedRequirement = Math.max(0, adjustedRequirement - rainfallInches);
    // Step 4: Adjust for temperature (>90°F increases by 20%)
    if (conditions.temperature > 90) {
        adjustedRequirement *= 1.2;
    }
    // Step 5: Calculate days since last irrigation
    const daysSince = getDaysSinceIrrigation(conditions.lastIrrigation);
    // Step 6: Determine action and timing
    let action;
    let timing;
    let reasoning;
    const weeklyNeed = adjustedRequirement;
    const dailyNeed = weeklyNeed / 7;
    const accumulatedNeed = dailyNeed * daysSince;
    if (accumulatedNeed >= weeklyNeed * 0.8) {
        action = 'irrigate_now';
        timing = 'Today';
        reasoning = `Your ${conditions.cropType} in ${conditions.growthStage} stage needs approximately ${weeklyNeed.toFixed(2)} inches per week. `;
        reasoning += `It has been ${daysSince} days since last irrigation. `;
        reasoning += `After accounting for ${rainfallInches.toFixed(2)} inches of recent rainfall and ${conditions.soilType} soil characteristics, `;
        reasoning += `immediate irrigation of ${adjustedRequirement.toFixed(2)} inches is recommended.`;
        if (conditions.temperature > 90) {
            reasoning += ` High temperature (${conditions.temperature}°F) increases water demand by 20%.`;
        }
    }
    else if (accumulatedNeed >= weeklyNeed * 0.5) {
        action = 'irrigate_soon';
        timing = 'Within 1-2 days';
        reasoning = `Your ${conditions.cropType} in ${conditions.growthStage} stage needs approximately ${weeklyNeed.toFixed(2)} inches per week. `;
        reasoning += `It has been ${daysSince} days since last irrigation. `;
        reasoning += `With ${rainfallInches.toFixed(2)} inches of recent rainfall and ${conditions.soilType} soil, `;
        reasoning += `you should plan to irrigate ${adjustedRequirement.toFixed(2)} inches within the next 1-2 days.`;
    }
    else {
        action = 'wait';
        timing = 'Not needed yet';
        reasoning = `Your ${conditions.cropType} in ${conditions.growthStage} stage needs approximately ${weeklyNeed.toFixed(2)} inches per week. `;
        reasoning += `With ${rainfallInches.toFixed(2)} inches of recent rainfall ${daysSince} days ago and ${conditions.soilType} soil retention, `;
        reasoning += `your field has sufficient moisture. No irrigation needed at this time.`;
    }
    return {
        recommendedInches: parseFloat(adjustedRequirement.toFixed(2)),
        action,
        timing,
        ruleReasoning: reasoning,
    };
}
