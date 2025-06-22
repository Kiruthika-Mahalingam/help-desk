import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Since we're using no-login system with AD lookup, these are placeholder routes
// that could be implemented if authentication is needed in the future

// Health check for auth system
router.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication system healthy',
    auth_required: false
  });
}));

// Validate session (placeholder)
router.get('/validate', asyncHandler(async (req, res) => {
  // Since we don't have authentication, always return valid
  res.json({
    success: true,
    valid: true,
    user: null
  });
}));

export default router;