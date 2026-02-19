'use client';

import { useState, useEffect } from 'react';
import { Box, Switch, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { PageContainer } from '@/app/components/PageContainer';
import { useSettings } from '@/app/lib/useSettings';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { loveMessages, floatingIcons, setLoveMessages, setFloatingIcons } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <PageContainer
      title="Settings"
      subtitle="These settings are stored on this device only."
    >
      <Box sx={{ maxWidth: 480, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TuneIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="h6">Game Settings</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
          <Box>
            <Typography variant="subtitle2">Love Messages</Typography>
            <Typography variant="caption" color="text.secondary">
              Floating &quot;Grampy loves you!&quot; messages during games
            </Typography>
          </Box>
          <Switch
            checked={loveMessages}
            onChange={(_, checked) => setLoveMessages(checked)}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
          <Box>
            <Typography variant="subtitle2">Floating Icons</Typography>
            <Typography variant="caption" color="text.secondary">
              Hearts, balloons, and other decorative emojis during games
            </Typography>
          </Box>
          <Switch
            checked={floatingIcons}
            onChange={(_, checked) => setFloatingIcons(checked)}
          />
        </Box>
      </Box>
    </PageContainer>
  );
}
