import { memo } from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import { tokens } from '../../styles/theme';

function StatCard({ label, value, helper, tone = 'primary.main' }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: tokens.borderCard,
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 20px ${tokens.shadowHover}`
        }
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontSize: '0.68rem' }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: tone,
            fontWeight: 700,
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
          }}
          title={String(value)}
        >
          {value}
        </Typography>
        {helper ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default memo(StatCard);
