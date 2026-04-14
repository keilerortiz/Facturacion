import { getDbPool, sql } from '../../config/database.js';

async function resolveRequest(executor) {
  if (executor) {
    return executor.request();
  }

  const pool = await getDbPool();
  return pool.request();
}

export const authRepository = {
  async findUserByUsuario(usuario, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('usuario', sql.NVarChar(100), usuario).query(`
      SELECT
        id,
        usuario,
        nombre,
        password_hash,
        rol,
        activo,
        fecha_creacion,
        fecha_modificacion,
        fecha_ultimo_acceso
      FROM Usuarios
      WHERE usuario = @usuario
    `);

    return result.recordset[0] || null;
  },

  async findUserById(id, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('id', sql.Int, Number(id)).query(`
      SELECT
        id,
        usuario,
        nombre,
        password_hash,
        rol,
        activo,
        fecha_creacion,
        fecha_modificacion,
        fecha_ultimo_acceso
      FROM Usuarios
      WHERE id = @id
    `);

    return result.recordset[0] || null;
  },

  async createUser(user, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('usuario', sql.NVarChar(100), user.usuario)
      .input('nombre', sql.NVarChar(150), user.nombre)
      .input('passwordHash', sql.NVarChar(255), user.passwordHash)
      .input('rol', sql.NVarChar(50), user.rol)
      .query(`
        INSERT INTO Usuarios (usuario, nombre, password_hash, rol, activo, fecha_creacion)
        OUTPUT
          inserted.id,
          inserted.usuario,
          inserted.nombre,
          inserted.rol,
          inserted.activo,
          inserted.fecha_creacion,
          inserted.fecha_modificacion,
          inserted.fecha_ultimo_acceso
        VALUES (@usuario, @nombre, @passwordHash, @rol, 1, SYSUTCDATETIME())
      `);

    return result.recordset[0];
  },

  async updateLastAccess(userId, executor) {
    const request = await resolveRequest(executor);

    await request.input('id', sql.Int, Number(userId)).query(`
      UPDATE Usuarios
      SET
        fecha_ultimo_acceso = SYSUTCDATETIME(),
        fecha_modificacion = SYSUTCDATETIME()
      WHERE id = @id
    `);
  },

  async updatePasswordHash(userId, passwordHash, executor) {
    const request = await resolveRequest(executor);

    await request
      .input('id', sql.Int, Number(userId))
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query(`
        UPDATE Usuarios
        SET
          password_hash = @passwordHash,
          fecha_modificacion = SYSUTCDATETIME()
        WHERE id = @id
      `);
  },

  async updateUserStatus(userId, activo, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('id', sql.Int, Number(userId))
      .input('activo', sql.Bit, activo)
      .query(`
        UPDATE Usuarios
        SET
          activo = @activo,
          fecha_modificacion = SYSUTCDATETIME()
        OUTPUT
          inserted.id,
          inserted.usuario,
          inserted.nombre,
          inserted.rol,
          inserted.activo,
          inserted.fecha_creacion,
          inserted.fecha_modificacion,
          inserted.fecha_ultimo_acceso
        WHERE id = @id
      `);

    return result.recordset[0] || null;
  },

  async listUsers(executor) {
    const request = await resolveRequest(executor);

    const result = await request.query(`
      SELECT
        id,
        usuario,
        nombre,
        rol,
        activo,
        fecha_creacion,
        fecha_modificacion,
        fecha_ultimo_acceso
      FROM Usuarios
      ORDER BY nombre ASC, usuario ASC
    `);

    return result.recordset;
  },

  async storeRefreshToken(refreshToken, executor) {
    const request = await resolveRequest(executor);

    await request
      .input('usuarioId', sql.Int, Number(refreshToken.usuarioId))
      .input('tokenHash', sql.NVarChar(255), refreshToken.tokenHash)
      .input('expiraEn', sql.DateTime2, refreshToken.expiraEn)
      .input('familia', sql.NVarChar(64), refreshToken.familia || null)
      .query(`
        INSERT INTO RefreshTokens (usuario_id, token_hash, expira_en, familia, fecha_creacion)
        VALUES (@usuarioId, @tokenHash, @expiraEn, @familia, SYSUTCDATETIME())
      `);
  },

  async findRefreshTokenByHash(tokenHash, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('tokenHash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT id, usuario_id, token_hash, expira_en, revocado_en, familia, fecha_creacion
        FROM RefreshTokens
        WHERE token_hash = @tokenHash
      `);

    return result.recordset[0] || null;
  },

  async revokeRefreshTokenById(tokenId, executor) {
    const request = await resolveRequest(executor);

    await request
      .input('id', sql.Int, Number(tokenId))
      .query(`
        UPDATE RefreshTokens
        SET revocado_en = SYSUTCDATETIME()
        WHERE id = @id AND revocado_en IS NULL
      `);
  },

  async revokeTokenFamily(familia, executor) {
    const request = await resolveRequest(executor);

    await request
      .input('familia', sql.NVarChar(64), familia)
      .query(`
        UPDATE RefreshTokens
        SET revocado_en = SYSUTCDATETIME()
        WHERE familia = @familia AND revocado_en IS NULL
      `);
  },

  async revokeActiveRefreshTokens(userId, executor) {
    const request = await resolveRequest(executor);

    await request.input('usuarioId', sql.Int, Number(userId)).query(`
      UPDATE RefreshTokens
      SET revocado_en = SYSUTCDATETIME()
      WHERE usuario_id = @usuarioId
        AND revocado_en IS NULL
    `);
  }
};
