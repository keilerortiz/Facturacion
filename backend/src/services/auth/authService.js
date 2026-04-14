import { withTransaction } from '../../config/database.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateUserStatusSchema
} from '../../domain/auth/authSchemas.js';
import { authRepository } from '../../repositories/auth/authRepository.js';
import { AppError } from '../../utils/AppError.js';
import {
  generateTemporaryPassword,
  hashPassword,
  validatePasswordStrength,
  verifyPassword
} from '../../utils/passwordUtils.js';
import {
  createAccessToken,
  createRefreshToken,
  createTokenFamily,
  getRefreshTokenExpiryDate,
  hashToken
} from '../../utils/tokenUtils.js';
import { logger } from '../../utils/logger.js';

function sanitizeUser(user) {
  return {
    id: user.id,
    usuario: user.usuario,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo,
    fechaCreacion: user.fecha_creacion,
    fechaModificacion: user.fecha_modificacion,
    fechaUltimoAcceso: user.fecha_ultimo_acceso
  };
}

function normalizeLoginPayload(payload = {}) {
  return {
    usuario: payload.usuario ?? payload.username,
    password: payload.password
  };
}

function normalizeRegisterPayload(payload = {}) {
  return {
    usuario: payload.usuario ?? payload.username,
    nombre: payload.nombre ?? payload.nombreCompleto,
    password: payload.password,
    rol: payload.rol
  };
}

export const authService = {
  async login(payload) {
    const credentials = loginSchema.parse(normalizeLoginPayload(payload));
    const user = await authRepository.findUserByUsuario(credentials.usuario);

    if (!user) {
      throw new AppError(401, 'Credenciales invalidas');
    }

    if (!user.activo) {
      throw new AppError(403, 'El usuario se encuentra inactivo');
    }

    const passwordMatches = await verifyPassword(credentials.password, user.password_hash);

    if (!passwordMatches) {
      throw new AppError(401, 'Credenciales invalidas');
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    const familia = createTokenFamily();

    await withTransaction(async (transaction) => {
      await authRepository.updateLastAccess(user.id, transaction);
      await authRepository.storeRefreshToken(
        {
          usuarioId: user.id,
          tokenHash: hashToken(refreshToken),
          expiraEn: getRefreshTokenExpiryDate(),
          familia
        },
        transaction
      );
    });

    return {
      data: {
        message: 'Login exitoso',
        accessToken,
        refreshToken,
        user: sanitizeUser(user)
      }
    };
  },

  async refresh(payload) {
    const { refreshToken } = payload || {};

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new AppError(400, 'Refresh token es requerido');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new AppError(401, 'Refresh token invalido');
    }

    if (stored.revocado_en) {
      // Token reuse detected — possible theft. Revoke entire family.
      if (stored.familia) {
        await authRepository.revokeTokenFamily(stored.familia);
        logger.warn('auth:token_reuse_detected', {
          userId: stored.usuario_id,
          familia: stored.familia
        });
      }
      throw new AppError(401, 'Refresh token ya fue utilizado. Todos los tokens de esta sesion han sido revocados.');
    }

    if (new Date(stored.expira_en) < new Date()) {
      throw new AppError(401, 'Refresh token expirado');
    }

    const user = await authRepository.findUserById(stored.usuario_id);

    if (!user || !user.activo) {
      throw new AppError(401, 'Usuario no autorizado o inactivo');
    }

    // Rotation: revoke old, issue new (same family)
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken();

    await withTransaction(async (transaction) => {
      await authRepository.revokeRefreshTokenById(stored.id, transaction);
      await authRepository.storeRefreshToken(
        {
          usuarioId: user.id,
          tokenHash: hashToken(newRefreshToken),
          expiraEn: getRefreshTokenExpiryDate(),
          familia: stored.familia
        },
        transaction
      );
    });

    return {
      data: {
        message: 'Token renovado exitosamente',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: sanitizeUser(user)
      }
    };
  },

  async logout(payload) {
    const { refreshToken } = payload || {};

    if (!refreshToken || typeof refreshToken !== 'string') {
      // Graceful — client may have lost the token
      return { data: { message: 'Sesion cerrada' } };
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (stored && !stored.revocado_en) {
      if (stored.familia) {
        await authRepository.revokeTokenFamily(stored.familia);
      } else {
        await authRepository.revokeRefreshTokenById(stored.id);
      }
    }

    return { data: { message: 'Sesion cerrada' } };
  },

  async register(payload) {
    const data = registerSchema.parse(normalizeRegisterPayload(payload));

    if (!validatePasswordStrength(data.password)) {
      throw new AppError(
        400,
        'La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula y un numero'
      );
    }

    const existingUser = await authRepository.findUserByUsuario(data.usuario);

    if (existingUser) {
      throw new AppError(409, 'Ya existe un usuario con ese nombre');
    }

    const passwordHash = await hashPassword(data.password);
    const createdUser = await authRepository.createUser({
      usuario: data.usuario,
      nombre: data.nombre,
      passwordHash,
      rol: data.rol
    });

    return {
      status: 201,
      data: {
        message: 'Usuario creado correctamente',
        user: sanitizeUser(createdUser)
      }
    };
  },

  async validate(auth) {
    const user = await authRepository.findUserById(auth.userId);

    if (!user || !user.activo) {
      throw new AppError(401, 'Token invalido o usuario inactivo');
    }

    return {
      data: {
        valid: true,
        user: sanitizeUser(user)
      }
    };
  },

  async profile(auth) {
    const user = await authRepository.findUserById(auth.userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    return {
      data: {
        user: sanitizeUser(user)
      }
    };
  },

  async changePassword(payload, auth) {
    const data = changePasswordSchema.parse(payload);

    if (!validatePasswordStrength(data.passwordNueva)) {
      throw new AppError(
        400,
        'La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula y un numero'
      );
    }

    const user = await authRepository.findUserById(auth.userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const passwordMatches = await verifyPassword(data.passwordActual, user.password_hash);

    if (!passwordMatches) {
      throw new AppError(401, 'La contrasena actual es incorrecta');
    }

    const isSamePassword = await verifyPassword(data.passwordNueva, user.password_hash);

    if (isSamePassword) {
      throw new AppError(400, 'La nueva contrasena no puede ser igual a la actual');
    }

    const newPasswordHash = await hashPassword(data.passwordNueva);

    await withTransaction(async (transaction) => {
      await authRepository.updatePasswordHash(auth.userId, newPasswordHash, transaction);
      await authRepository.revokeActiveRefreshTokens(auth.userId, transaction);
    });

    return {
      data: {
        message: 'Contrasena actualizada correctamente'
      }
    };
  },

  async listUsers() {
    const users = await authRepository.listUsers();

    return {
      data: {
        items: users.map(sanitizeUser)
      }
    };
  },

  async updateUserStatus(id, payload, auth) {
    const data = updateUserStatusSchema.parse(payload);
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, 'Identificador de usuario invalido');
    }

    if (auth.userId === userId) {
      throw new AppError(400, 'No puede cambiar el estado de su propio usuario');
    }

    const targetUser = await authRepository.findUserById(userId);

    if (!targetUser) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const updatedUser = await withTransaction(async (transaction) => {
      const changedUser = await authRepository.updateUserStatus(userId, data.activo, transaction);

      if (!data.activo) {
        await authRepository.revokeActiveRefreshTokens(userId, transaction);
      }

      return changedUser;
    });

    return {
      data: {
        message: `Usuario ${data.activo ? 'activado' : 'desactivado'} correctamente`,
        user: sanitizeUser(updatedUser)
      }
    };
  },

  async resetPassword(id, auth) {
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, 'Identificador de usuario invalido');
    }

    if (auth.userId === userId) {
      throw new AppError(400, 'Use el cambio de contrasena para actualizar su propia clave');
    }

    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await withTransaction(async (transaction) => {
      await authRepository.updatePasswordHash(userId, passwordHash, transaction);
      await authRepository.revokeActiveRefreshTokens(userId, transaction);
    });

    return {
      data: {
        message: 'Contrasena reseteada correctamente',
        temporaryPassword
      }
    };
  }
};
