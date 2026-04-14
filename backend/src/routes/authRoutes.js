import { Router } from 'express';
import { authController } from '../controllers/auth/authController.js';
import { loginRateLimiter } from '../middleware/rateLimiters.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';

export const authRoutes = Router();

authRoutes.post('/login', loginRateLimiter, authController.login);
authRoutes.post('/register', authMiddleware, requireRoles(ROLES.ADMIN), authController.register);
authRoutes.get('/validate', authMiddleware, authController.validate);
authRoutes.get('/perfil', authMiddleware, authController.profile);
authRoutes.post('/cambiar-contrasena', authMiddleware, authController.changePassword);
authRoutes.get('/usuarios', authMiddleware, requireRoles(ROLES.ADMIN), authController.listUsers);
authRoutes.patch(
  '/usuarios/:id/estado',
  authMiddleware,
  requireRoles(ROLES.ADMIN),
  authController.updateUserStatus
);
authRoutes.post(
  '/usuarios/:id/resetear-contrasena',
  authMiddleware,
  requireRoles(ROLES.ADMIN),
  authController.resetPassword
);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
