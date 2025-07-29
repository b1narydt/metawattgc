import * as React from 'react';
import { useState, useEffect } from 'react';
import { createCard, loadCards, redeemCard, CardData } from './CardManager';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';

// Rarity options
const RARITY_OPTIONS = [
  { value: 'common', label: 'Common', color: 'grey' },
  { value: 'uncommon', label: 'Uncommon', color: 'green' },
  { value: 'rare', label: 'Rare', color: 'blue' },
  { value: 'epic', label: 'Epic', color: 'purple' },
  { value: 'legendary', label: 'Legendary', color: 'orange' },
];

// Initial form state
const initialFormState = {
  name: '',
  description: '',
  rarity: 'common',
  ability: '',
  history: '',
  sats: 1000,
};

type FormErrors = {
  [key: string]: string;
};

const App: React.FC = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load cards on mount
  useEffect(() => {
    fetchCards();
  }, []);

  // Fetch cards from the wallet
  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const loadedCards = await loadCards();
      setCards(loadedCards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      showSnackbar('Failed to load cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes for text fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e: { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.ability.trim()) newErrors.ability = 'Ability is required';
    if (formData.sats <= 0) newErrors.sats = 'Sats must be greater than 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showSnackbar('Please fix the form errors', 'error');
      return;
    }
    
    try {
      setIsCreating(true);
      await createCard(formData);
      setFormData(initialFormState);
      await fetchCards();
      showSnackbar('Card created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create card:', error);
      showSnackbar('Failed to create card', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle card redemption
  const handleRedeem = async (card: CardData) => {
    if (window.confirm(`Are you sure you want to redeem ${card.name}?`)) {
      try {
        await redeemCard(card);
        await fetchCards();
        showSnackbar('Card redeemed successfully!', 'success');
      } catch (error) {
        console.error('Failed to redeem card:', error);
        showSnackbar('Failed to redeem card', 'error');
      }
    }
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false,
    }));
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    const rarityOption = RARITY_OPTIONS.find(r => r.value === rarity);
    return rarityOption ? rarityOption.color : 'grey';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          🃏 Collectible Card Creator
        </Typography>
        
        {/* Create Card Form */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Create New Card
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Card Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  margin="normal"
                  variant="outlined"
                />
                
                <FormControl fullWidth margin="normal" error={!!errors.rarity}>
                  <InputLabel>Rarity</InputLabel>
                  <Select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleSelectChange}
                    label="Rarity"
                  >
                    {RARITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: option.color,
                              mr: 1,
                            }}
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Sats"
                  name="sats"
                  type="number"
                  value={formData.sats}
                  onChange={handleInputChange}
                  error={!!errors.sats}
                  helperText={errors.sats}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={3}
                />
                
                <TextField
                  fullWidth
                  label="Special Ability"
                  name="ability"
                  value={formData.ability}
                  onChange={handleInputChange}
                  error={!!errors.ability}
                  helperText={errors.ability || 'What makes this card special?'}
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  label="History (Optional)"
                  name="history"
                  value={formData.history}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Card'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        {/* Cards List */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Collection
            {isLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : cards.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No cards found. Create your first card to get started!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {cards.map((card) => (
                <Grid item xs={12} sm={6} md={4} key={`${card.txid}-${card.outputIndex}`}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `4px solid ${getRarityColor(card.rarity)}`,
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" component="h3" noWrap>
                          {String(card.name || 'Unnamed Card')}
                        </Typography>
                        {card.rarity && (
                          <Chip 
                            label={String(card.rarity).charAt(0).toUpperCase() + String(card.rarity).slice(1)}
                            size="small"
                            sx={{
                              bgcolor: `${getRarityColor(String(card.rarity))}.light`,
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                      
                      {card.sats && (
                        <Chip 
                          label={`⚡ ${Number(card.sats) || 0} sats`} 
                          size="small" 
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}
                      
                      {card.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {String(card.description)}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 'auto' }}>
                        {card.ability && (
                          <>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Special Ability:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                              {String(card.ability)}
                            </Typography>
                          </>
                        )}
                        
                        {card.history && (
                          <>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              History:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {String(card.history)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        color="error"
                        variant="outlined"
                        onClick={() => handleRedeem(card)}
                      >
                        Redeem
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;