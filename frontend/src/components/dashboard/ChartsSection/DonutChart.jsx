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
 * Formatea números grandes a notación corta (M para millones)
 * Ejemplo: 12443124 → "12,4M"
 */
function formatLargeNumber(num) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace('.', ',') + 'K';
  }
  return num.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

/**
 * Gráfico Donut (Pie) con leyenda responsiva:
 * 
 * LAYOUT:
 * - Desktop (md+): Donut a la izquierda (50%), leyenda grid a la derecha (50%)
 * - Tablet/Mobile: Donut arriba, leyenda en grid 2 columnas abajo
 * 
 * LEYENDA:
 * - Grid responsivo con items independientes
 * - Cada item: [color dot] [Label] [Percentage]
 * - Sin overflow horizontal
 * - Fondo sutil y hover effect
 * 
 * FEATURES:
 * - Total en el centro del donut
 * - Colores personalizables
 * - Formato de números grandes (M para millones)
 * - Responsive y accesible
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
        px: { xs: 3, sm: 3.5, md: 4 },
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
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

      {/* Container principal: Donut + Leyenda en columna */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* DONUT CHART - Full width */}
        <Box
          sx={{
            flex: '0 0 auto',
            height: height,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={85}
                innerRadius={50}
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

          {/* Total en el centro del donut (sin label) */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.3rem',
                color: 'primary.main',
              }}
            >
              {formatLargeNumber(total)}
            </Typography>
          </Box>
        </Box>

        {/* LEYENDA COMPACTA - Horizontal debajo */}
        {showLegend && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: { xs: 1.5, sm: 2.5, md: 3 },
              pt: 1,
              overflowX: { xs: 'auto', md: 'visible' },
              paddingBottom: { xs: 1, md: 0 },
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
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 'fit-content',
                    flexShrink: 0,
                  }}
                >
                  {/* Porcentaje grande */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      color: chartColors[idx % chartColors.length],
                      lineHeight: 1,
                    }}
                  >
                    {pct}%
                  </Typography>

                  {/* Label con color dot */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6,
                      justifyContent: 'center',
                    }}
                  >
                    {/* Color indicator - pequeño círculo */}
                    <Box
                      sx={{
                        width: { xs: 6, sm: 8 },
                        height: { xs: 6, sm: 8 },
                        borderRadius: '50%',
                        bgcolor: chartColors[idx % chartColors.length],
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    />

                    {/* Label */}
                    <Typography
                      sx={{
                        fontSize: { xs: '0.55rem', sm: '0.65rem' },
                        color: 'text.secondary',
                        fontWeight: 500,
                        textAlign: 'center',
                        maxWidth: { xs: 60, sm: 80 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item[nameKey]}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default memo(DonutChart);
