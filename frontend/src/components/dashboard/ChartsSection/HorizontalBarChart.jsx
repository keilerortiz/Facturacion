import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { tokens } from '../../../styles/theme';

/**
 * Gráfico de barras horizontales con:
 * - Valores y porcentajes visibles
 * - Colores personalizables
 * - Etiquetas legibles
 * - Responsive
 */
function HorizontalBarChart({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  showValues = true,
  showPercentage = false,
  barColor = '#1976d2',
  height = 280,
  colors = [],
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

  // Calcular máximo para porcentajes
  const maxValue = Math.max(...data.map((d) => d[dataKey] || 0));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
        minHeight: height + 85,
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
          <XAxis type="number" stroke={tokens.textSecondary} style={{ fontSize: '0.75rem' }} />
          <YAxis
            dataKey={nameKey}
            type="category"
            stroke={tokens.textSecondary}
            style={{ fontSize: '0.75rem' }}
            width={180}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: '0.75rem',
            }}
            formatter={(value) => {
              let result = value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
              if (showPercentage && maxValue > 0) {
                const pct = ((value / maxValue) * 100).toFixed(1);
                result += ` (${pct}%)`;
              }
              return result;
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey={dataKey} fill={barColor} radius={[0, 8, 8, 0]}>
            {colors.length > 0
              ? colors.map((color, idx) => <Cell key={`cell-${idx}`} fill={color} />)
              : data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={`rgba(25, 118, 210, ${1 - idx * 0.12})`} // Degradado de azul
                  />
                ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default memo(HorizontalBarChart);
