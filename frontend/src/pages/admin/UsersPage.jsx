import { useEffect, useState } from 'react';
import { tokens } from '../../styles/theme';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';

const initialForm = {
  usuario: '',
  nombre: '',
  password: '',
  rol: 'operador'
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await authService.listUsers();
      setUsers(response.items || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No fue posible cargar usuarios'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setTemporaryPassword('');

    try {
      const response = await authService.register(form);
      setSuccess(response.message || 'Usuario creado correctamente');
      setForm(initialForm);
      await loadUsers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No fue posible crear el usuario'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (currentUser?.id === user.id) {
      setError('No puedes cambiar el estado de tu propio usuario desde esta pantalla.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await authService.updateUserStatus(user.id, {
        activo: !user.activo
      });
      setSuccess(response.message);
      await loadUsers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No fue posible actualizar el usuario'));
    }
  };

  const handleResetPassword = async (user) => {
    if (currentUser?.id === user.id) {
      setError('No puedes resetear tu propia contrasena desde esta pantalla.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await authService.resetPassword(user.id);
      setSuccess(response.message);
      setTemporaryPassword(
        `Contrasena temporal para ${user.usuario}: ${response.temporaryPassword}`
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No fue posible resetear la contrasena'));
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Administracion"
        title="Usuarios y acceso"
        description="Gestiona las cuentas de operadores y administradores, su estado y reseteo de credenciales."
        chip="Solo administradores"
      />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 2.5, border: `1px solid ${tokens.borderLight}` }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Crear usuario
            </Typography>
            <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
              {temporaryPassword ? <Alert severity="warning">{temporaryPassword}</Alert> : null}
              <TextField
                label="Usuario"
                value={form.usuario}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usuario: event.target.value }))
                }
                required
              />
              <TextField
                label="Nombre completo"
                value={form.nombre}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nombre: event.target.value }))
                }
                required
              />
              <TextField
                label="Contrasena inicial"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
              <TextField
                select
                SelectProps={{ native: true }}
                label="Rol"
                value={form.rol}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rol: event.target.value }))
                }
              >
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </TextField>
              <Button type="submit" variant="contained" disabled={saving} fullWidth>
                {saving ? 'Guardando...' : 'Crear usuario'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ overflow: 'hidden', border: `1px solid ${tokens.borderLight}` }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Usuarios registrados
              </Typography>
            </Box>
            <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Ultimo acceso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Cargando usuarios...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No hay usuarios registrados.</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.usuario}</TableCell>
                      <TableCell>{user.nombre}</TableCell>
                      <TableCell>{user.rol}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Switch
                            checked={Boolean(user.activo)}
                            onChange={() => handleToggleStatus(user)}
                            disabled={currentUser?.id === user.id}
                          />
                          <Typography variant="body2">
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDateTime(user.fechaUltimoAcceso)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleResetPassword(user)}
                          disabled={currentUser?.id === user.id}
                        >
                          Resetear clave
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UsersPage;
