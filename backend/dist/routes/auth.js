"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Since we're using no-login system with AD lookup, these are placeholder routes
// that could be implemented if authentication is needed in the future
// Health check for auth system
router.get('/health', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Authentication system healthy',
        auth_required: false
    });
}));
// Validate session (placeholder)
router.get('/validate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Since we don't have authentication, always return valid
    res.json({
        success: true,
        valid: true,
        user: null
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map