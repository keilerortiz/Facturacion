import { memo } from 'react';
import { Box, Paper } from '@mui/material';
import { tokens } from '../../../styles/theme';

/**
 * Wrapper para gráficos
 * Proporciona estilos consistentes y estructura
 */
function ChartContainer({ children, sx = {} }) {
  return (
    <Box sx={sx}>
      {children}
    </Box>
  );
}

export default memo(ChartContainer);
