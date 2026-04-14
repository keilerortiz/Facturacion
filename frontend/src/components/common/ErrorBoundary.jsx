import { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Error info is available via getDerivedStateFromError
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Ocurrio un error inesperado
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Intenta recargar la pagina. Si el problema persiste, contacta al administrador.
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Recargar pagina
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
