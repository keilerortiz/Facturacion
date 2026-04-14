import { z } from 'zod';
import { ROLES } from '../../constants/roles.js';

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'El usuario es requerido'),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  usuario: z.string().trim().min(3).max(100),
  nombre: z.string().trim().min(1).max(150),
  password: z.string().min(8),
  rol: z.enum([ROLES.ADMIN, ROLES.OPERADOR, ROLES.CONSULTOR]).default(ROLES.OPERADOR)
});

export const changePasswordSchema = z
  .object({
    passwordActual: z.string().min(1),
    passwordNueva: z.string().min(8),
    passwordNuevaConfirm: z.string().min(8)
  })
  .refine((value) => value.passwordNueva === value.passwordNuevaConfirm, {
    path: ['passwordNuevaConfirm'],
    message: 'La confirmacion de la contrasena no coincide'
  });

export const updateUserStatusSchema = z.object({
  activo: z.boolean()
});
