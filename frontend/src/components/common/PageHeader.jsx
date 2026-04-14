import { memo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

function PageHeader({ eyebrow, title, description, chip }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ color: 'primary.light', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.68rem' }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        {chip ? <Chip label={chip} size="small" color="secondary" variant="outlined" /> : null}
      </Stack>
      <Typography variant="h5" sx={{ mb: description ? 0.75 : 0 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" sx={{ maxWidth: 640, color: 'text.secondary', lineHeight: 1.7 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

export default memo(PageHeader);
