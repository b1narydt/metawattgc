import * as React from 'react';
import { Box, Container, Typography } from '@mui/material';
import EnergyTagPanel from './components/EnergyTagPanel';

const App: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          MetawattGC — EnergyTag Granular Certificates
        </Typography>
        <EnergyTagPanel />
      </Container>
    </Box>
  );
};

export default App;
