import { memo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { tokens } from '../../../styles/theme';

/**
 * Gráfico Combo (Barras + Línea) con:
 * - Eje doble (izquierda y derecha)
 * - Barras para datos principales
 * - Línea para datos secundarios
 * - Colores distintivos
 * - Responsive
 */
function ComboChart({
  title,
  subtitle,
  data = [],
  barKey = 'bars',
  lineKey = 'line',
  barColor = '#1976d2',
  lineColor = '#4caf50',
  barLabel = 'Ingresos',
  lineLabel = 'Cantidad',
  height = 300,
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
        minHeight: height + 80,
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
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 80, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} />
          
          {/* Eje X */}
          <XAxis
            dataKey="date"
            stroke={tokens.textSecondary}
            style={{ fontSize: '0.75rem' }}
            tick={{ fill: tokens.textSecondary }}
          />
          
          {/* Eje Y izquierdo (Barras - valores monetarios) */}
          <YAxis
            yAxisId="left"
            stroke={barColor}
            style={{ fontSize: '0.75rem' }}
            tick={{ fill: barColor }}
            label={{
              value: barLabel,
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '0.75rem', fill: barColor },
            }}
          />
          
          {/* Eje Y derecho (Línea - cantidad) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={lineColor}
            style={{ fontSize: '0.75rem' }}
            tick={{ fill: lineColor }}
            label={{
              value: lineLabel,
              angle: 90,
              position: 'insideRight',
              style: { fontSize: '0.75rem', fill: lineColor },
            }}
          />
          
          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: '0.75rem',
            }}
            formatter={(value, name) => {
              if (name === barKey) {
                return [
                  value.toLocaleString('es-ES', { maximumFractionDigits: 0 }),
                  barLabel,
                ];
              }
              return [
                value.toLocaleString('es-ES', { maximumFractionDigits: 0 }),
                lineLabel,
              ];
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          
          {/* Leyenda */}
          <Legend
            wrapperStyle={{ fontSize: '0.75rem', paddingTop: '16px' }}
            iconType="line"
          />
          
          {/* Barras (eje izquierdo) */}
          <Bar yAxisId="left" dataKey={barKey} fill={barColor} radius={[8, 8, 0, 0]} />
          
          {/* Línea (eje derecho) */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={lineKey}
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ fill: lineColor, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default memo(ComboChart);
