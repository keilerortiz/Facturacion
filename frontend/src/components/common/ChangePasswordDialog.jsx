import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

const initialState = {
  passwordActual: '',
  passwordNueva: '',
  passwordNuevaConfirm: ''
};

function ChangePasswordDialog({ open, onClose }) {
  const { changePassword } = useAuth();
  const [values, setValues] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) {
      setValues(initialState);
      setSaving(false);
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await changePassword(values);
      setSuccess(response.message || 'Contrasena actualizada correctamente');
      setValues(initialState);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'No fue posible actualizar la contrasena'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Cambiar contrasena</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}
          <TextField
            label="Contrasena actual"
            type="password"
            value={values.passwordActual}
            onChange={(event) =>
              setValues((current) => ({ ...current, passwordActual: event.target.value }))
            }
            required
          />
          <TextField
            label="Nueva contrasena"
            type="password"
            value={values.passwordNueva}
            onChange={(event) =>
              setValues((current) => ({ ...current, passwordNueva: event.target.value }))
            }
            required
            helperText="Minimo 8 caracteres, mayuscula, minuscula y numero"
          />
          <TextField
            label="Confirmar nueva contrasena"
            type="password"
            value={values.passwordNuevaConfirm}
            onChange={(event) =>
              setValues((current) => ({ ...current, passwordNuevaConfirm: event.target.value }))
            }
            required
          />
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Actualizar contrasena'}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChangePasswordDialog;
