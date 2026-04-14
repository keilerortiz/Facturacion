import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'grid',
        placeItems: 'center'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={42} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>{message}</Typography>
      </Box>
    </Box>
  );
}

export default LoadingScreen;
