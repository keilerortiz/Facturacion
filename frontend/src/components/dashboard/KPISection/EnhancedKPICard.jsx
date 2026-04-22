import { memo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { tokens } from '../../../styles/theme';

/**
 * KPI Card mejorada con:
 * - Icono + Etiqueta
 * - Valor destacado
 * - Sparkline
 * - Variación con color
 */
function EnhancedKPICard({
  icon: IconComponent,
  label,
  value,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  sparklineData = [],
  tone = 'primary',
  subtitle,
}) {
  const theme = useTheme();

  // Colores por tipo de cambio
  const changeColor = {
    positive: '#4caf50',
    negative: '#f44336',
    neutral: '#757575',
  }[changeType];

  // Icono con color
  const iconColor = {
    primary: '#1976d2',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  }[tone] || '#1976d2';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: `0 12px 24px rgba(0, 0, 0, 0.08)`,
          transform: 'translateY(-2px)',
          borderColor: iconColor,
        },
      }}
    >
      {/* Header: Icono + Etiqueta */}
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 1.5 }}>
        {IconComponent && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: `${iconColor}15`, // Color con 10% de opacidad
              color: iconColor,
              flexShrink: 0,
            }}
          >
            <IconComponent sx={{ fontSize: '1.5rem' }} />
          </Box>
        )}
        <Stack spacing={0} sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'text.secondary',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: 'text.secondary',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Sparkline (mini gráfico) */}
      {sparklineData.length > 0 && (
        <Box sx={{ height: 40, mb: 1.5, mx: -2, px: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                }}
                cursor={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={iconColor}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Valor principal */}
      <Typography
        variant="h5"
        sx={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: iconColor,
          lineHeight: 1.15,
          mb: 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
        title={String(value)}
      >
        {value}
      </Typography>

      {/* Cambio / Variación */}
      {change && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: changeColor,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: 'flex-end',
          }}
        >
          {changeType === 'positive' && '↑ '}
          {changeType === 'negative' && '↓ '}
          {change}
        </Typography>
      )}
    </Paper>
  );
}

export default memo(EnhancedKPICard);
