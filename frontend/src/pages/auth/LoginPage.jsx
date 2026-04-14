import { useState } from 'react';
import { tokens } from '../../styles/theme';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, authenticating } = useAuth();
  const [credentials, setCredentials] = useState({
    usuario: '',
    password: ''
  });
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(credentials);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'No fue posible iniciar sesion'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: `0 18px 52px ${tokens.shadowCard}`
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 4.5,
            background:
              'linear-gradient(135deg, rgb(34, 74, 99) 0%, rgb(1, 40, 65) 56%, rgb(0, 28, 46) 100%)',
            color: 'white'
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: '0.14em' }}>
            Plataforma Operativa
          </Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>
            Facturacion
          </Typography>
          <Typography sx={{ mt: 1.5, opacity: 0.88 }}>
            Accede al registro, consulta y auditoría de movimientos desde un solo panel.
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Usuario"
              value={credentials.usuario}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, usuario: event.target.value }))
              }
              autoFocus
              required
            />
            <TextField
              label="Contrasena"
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            <Button type="submit" variant="contained" disabled={authenticating} fullWidth>
              {authenticating ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPage;
