import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimit';
import { validateBody } from '../../middleware/validate';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from './auth.validation';

/**
 * Public authentication surface.
 * Deliberately no registration endpoint exists — accounts are provisioned by
 * the Super Admin (district/unit admins) or by district/unit administrators (members).
 */
export const authRoutes = Router();

authRoutes.post('/login', authLimiter, validateBody(loginSchema), authController.login);
authRoutes.post('/refresh', authLimiter, validateBody(refreshTokenSchema), authController.refresh);
authRoutes.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.get('/me', authenticate, authController.me);
authRoutes.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword,
);
