import { memo, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtDateShort(str) {
  if (!str) return '';
  const [, mm, dd] = str.split('-');
  return `${dd} ${MONTHS_SHORT[Number(mm) - 1]}`;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const QUICK_PRESETS = [
  { id: 'hoy', label: 'Hoy', get: () => ({ fechaDesde: isoToday(), fechaHasta: isoToday() }) },
  { id: '7d', label: '7 días', get: () => ({ fechaDesde: isoOffset(-6), fechaHasta: isoToday() }) },
];

function DashboardFilters({ filters, owners, vtas, onFilterChange, onClearFilters }) {
  // Contar filtros activos
  const activeFilterCount = useMemo(
    () => [filters.fechaDesde, filters.fechaHasta, filters.propietarioId, filters.vtaId].filter(Boolean).length,
    [filters.fechaDesde, filters.fechaHasta, filters.propietarioId, filters.vtaId]
  );

  const handleQuickPreset = (preset) => {
    const newDates = preset.get();
    onFilterChange('fechaDesde', newDates.fechaDesde);
    onFilterChange('fechaHasta', newDates.fechaHasta);
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
      {/* Campos de filtro en línea */}
      <TextField
        label="Desde"
        type="date"
        size="small"
        value={filters.fechaDesde || ''}
        onChange={(e) => onFilterChange('fechaDesde', e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 130 }}
      />
      <TextField
        label="Hasta"
        type="date"
        size="small"
        value={filters.fechaHasta || ''}
        onChange={(e) => onFilterChange('fechaHasta', e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 130 }}
      />
      <Autocomplete
        size="small"
        options={owners}
        getOptionLabel={(o) => o.nombre}
        isOptionEqualToValue={(opt, val) => String(opt.id) === String(val?.id)}
        value={owners.find((o) => String(o.id) === String(filters.propietarioId)) ?? null}
        onChange={(_, newVal) => onFilterChange('propietarioId', newVal ? newVal.id : '')}
        renderInput={(params) => (
          <TextField {...params} placeholder="Propietario" />
        )}
        sx={{ minWidth: 140, flex: 1 }}
      />
      <Autocomplete
        size="small"
        options={vtas}
        getOptionLabel={(v) => `${v.codigo} - ${v.nombre}`}
        isOptionEqualToValue={(opt, val) => String(opt.id) === String(val?.id)}
        value={vtas.find((v) => String(v.id) === String(filters.vtaId)) ?? null}
        onChange={(_, newVal) => onFilterChange('vtaId', newVal ? newVal.id : '')}
        disabled={!filters.propietarioId}
        renderInput={(params) => (
          <TextField {...params} placeholder="VTA" />
        )}
        sx={{ minWidth: 140, flex: 1 }}
      />

      {/* Botones rápidos */}
      {QUICK_PRESETS.map((preset) => (
        <Button
          key={preset.id}
          variant="outlined"
          size="small"
          onClick={() => handleQuickPreset(preset)}
          sx={{
            fontSize: '0.75rem',
            py: 0.75,
            px: 1.25
          }}
        >
          {preset.label}
        </Button>
      ))}

      {/* Botón limpiar */}
      {activeFilterCount > 0 && (
        <Tooltip title="Limpiar filtros">
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffIcon />}
            onClick={onClearFilters}
            sx={{
              fontSize: '0.75rem',
              py: 0.75,
              px: 1.25,
              color: 'error.main',
              borderColor: 'error.light'
            }}
          >
            Limpiar
          </Button>
        </Tooltip>
      )}
    </Stack>
  );
}

export default memo(DashboardFilters);
