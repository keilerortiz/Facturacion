import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { formatDateTime } from '../../utils/date';

function HistorialDialog({ open, movement, items, loading, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Historial de cambios
        {movement ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Movimiento #{movement.id} · {movement.propietario} · {movement.vtaCodigo}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>Cargando historial...</Typography>
        ) : items.length === 0 ? (
          <Typography>No hay cambios auditados para este movimiento.</Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {items.map((item) => (
              <ListItem key={item.id} divider sx={{ px: 0, py: 1.75, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {item.campo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                        {formatDateTime(item.fecha)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                      <Stack direction="row" spacing={0.75}>
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minWidth: 52, flexShrink: 0 }}>Antes</Typography>
                        <Typography component="span" variant="body2" sx={{ color: 'error.main' }}>{item.valorAnterior || '—'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75}>
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, minWidth: 52, flexShrink: 0 }}>Después</Typography>
                        <Typography component="span" variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>{item.valorNuevo || '—'}</Typography>
                      </Stack>
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mt: 0.25 }}>Por: {item.usuario}</Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default memo(HistorialDialog);
