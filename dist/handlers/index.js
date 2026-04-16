"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackHandler = exports.recommendationsHandler = exports.fieldsHandler = exports.farmsHandler = void 0;
// Export all handlers for Lambda
var farms_1 = require("./farms");
Object.defineProperty(exports, "farmsHandler", { enumerable: true, get: function () { return farms_1.handler; } });
var fields_1 = require("./fields");
Object.defineProperty(exports, "fieldsHandler", { enumerable: true, get: function () { return fields_1.handler; } });
var recommendations_1 = require("./recommendations");
Object.defineProperty(exports, "recommendationsHandler", { enumerable: true, get: function () { return recommendations_1.handler; } });
var feedback_1 = require("./feedback");
Object.defineProperty(exports, "feedbackHandler", { enumerable: true, get: function () { return feedback_1.handler; } });
