import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { tokens } from '../../../styles/theme';

/**
 * Gráfico Donut (Pie) con:
 * - Valor total en el centro
 * - Leyenda con porcentajes
 * - Colores personalizables
 */
function DonutChart({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors = [],
  height = 280,
  centerLabel = 'Total',
  showLegend = true,
}) {
  if (data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${tokens.borderCard}`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: height,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sin datos disponibles
        </Typography>
      </Paper>
    );
  }

  // Calcular total
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  // Colores por defecto si no se proporcionan
  const defaultColors = [
    '#1976d2', // Azul
    '#4caf50', // Verde
    '#ff9800', // Naranja
    '#f44336', // Rojo
    '#2196f3', // Azul claro
    '#81c784', // Verde claro
  ];

  const chartColors = colors.length > 0 ? colors : defaultColors;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
        minHeight: height + 60,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            mb: 0.25,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Chart con leyenda */}
      <Stack direction="row" spacing={2} sx={{ flex: 1, alignItems: 'center' }}>
        {/* Donut */}
        <Box sx={{ flex: 1, minHeight: height - 80 }}>
          <ResponsiveContainer width="100%" height={height - 80}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={60}
                innerRadius={35}
                fill="#8884d8"
                dataKey={dataKey}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                }}
                formatter={(value) => {
                  const pct = ((value / total) * 100).toFixed(1);
                  return `${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} (${pct}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Leyenda personalizada (vertical) */}
        {showLegend && (
          <Stack
            spacing={1}
            sx={{
              maxWidth: 150,
              fontSize: '0.75rem',
            }}
          >
            {data.map((item, idx) => {
              const value = item[dataKey] || 0;
              const pct = ((value / total) * 100).toFixed(1);
              return (
                <Box
                  key={`legend-${idx}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: chartColors[idx % chartColors.length],
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item[nameKey]}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                      }}
                    >
                      {pct}%
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>

      {/* Total en el centro (opcional) */}
      {centerLabel && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            {centerLabel}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'primary.main',
            }}
          >
            {total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default memo(DonutChart);
