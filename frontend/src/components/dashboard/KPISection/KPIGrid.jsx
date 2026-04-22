import { memo } from 'react';
import { Grid } from '@mui/material';
import EnhancedKPICard from './EnhancedKPICard';

/**
 * Grid de 5 KPIs principales
 * Organiza las tarjetas KPI de forma responsiva
 */
function KPIGrid({
  totalMovimientos,
  ticketPromedio,
  facturacionTotal,
  cantidadTotal,
  sparklineData = [],
}) {
  return (
    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
      {/* KPI 1: Total Movimientos */}
      <Grid item xs={6} sm={4} md={2.2}>
        <EnhancedKPICard
          icon={null}
          label="Total Movimientos"
          value={String(totalMovimientos ?? 0)}
          tone="primary"
          subtitle="Registrados"
        />
      </Grid>

      {/* KPI 2: Cantidad Total */}
      <Grid item xs={6} sm={4} md={2.3}>
        <EnhancedKPICard
          icon={null}
          label="Cantidad Total"
          value={String(cantidadTotal ?? 0)}
          tone="warning"
          subtitle="Unidades acumuladas"
        />
      </Grid>

      {/* KPI 3: Ticket Promedio (a la izquierda de facturación) */}
      <Grid item xs={6} sm={4} md={3.5}>
        <EnhancedKPICard
          icon={null}
          label="Ticket Promedio"
          value={ticketPromedio}
          tone="info"
          subtitle="Por movimiento"
        />
      </Grid>

      {/* KPI 4: Facturación Total */}
      <Grid item xs={12} sm={12} md={4}>
        <EnhancedKPICard
          icon={null}
          label="Facturación Total"
          value={facturacionTotal}
          tone="success"
          subtitle="Período actual"
        />
      </Grid>
    </Grid>
  );
}

export default memo(KPIGrid);
