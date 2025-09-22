import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, Grid, TextField, Button, Divider, Chip, Stack, Alert } from '@mui/material'
import { issueMockBundle, queryBundles, redeemBundle, publishBundle, listActiveOutputs, decodeOutputs, walletLoadBundles } from '../api/energyTag'
import type { GranularCertificateBundle } from '../types/energyTag'

const EnergyTagPanel: React.FC = () => {
  const [name, setName] = useState('Solar kWh')
  const [description, setDescription] = useState('Mock GC via Pushdrop')
  const [sats, setSats] = useState<number>(1000)
  const [quantity, setQuantity] = useState<number>(5)
  const [bundles, setBundles] = useState<GranularCertificateBundle[]>([])
  const [loading, setLoading] = useState(false)
  const [marketOutputs, setMarketOutputs] = useState<Array<{ beef: number[]; outputIndex: number }>>([])
  const [error, setError] = useState<string>('')
  const [decodedMarket, setDecodedMarket] = useState<Array<{
    outputIndex: number;
    issuance_id?: string;
    device_name?: string;
    bundle_quantity?: number;
    face_value?: number;
    certificate_status?: string;
    production_starting_interval?: string;
    production_ending_interval?: string;
    error?: string;
  }>>([])

  const handleIssue = async () => {
    try {
      setLoading(true)
      setError('')
      await issueMockBundle({ name, description, sats })
      // Refresh bundles inline after issuing
      const res = await queryBundles({
        source_account_id: '00000000-0000-0000-0000-000000000000',
        source_user_id: '00000000-0000-0000-0000-000000000000',
        certificate_quantity: Number(quantity) || undefined,
      })
      setBundles(res.filtered_certificate_bundles ?? [])
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMarket = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listActiveOutputs()
      if (res && res.type === 'output-list' && Array.isArray(res.outputs)) {
        setMarketOutputs(res.outputs)
        try {
          const decoded = await decodeOutputs(res.outputs)
          setDecodedMarket(decoded.items || [])
        } catch (e: any) {
          console.warn('decodeOutputs failed', e)
          setDecodedMarket([])
        }
      } else {
        setMarketOutputs([])
        setDecodedMarket([])
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load marketplace outputs')
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async () => {
    setLoading(true)
    setError('')
    try {
      // Ensure wallet has the latest outputs loaded via backend
      await walletLoadBundles()
      const res = await queryBundles({
        source_account_id: '00000000-0000-0000-0000-000000000000',
        source_user_id: '00000000-0000-0000-0000-000000000000',
        certificate_quantity: Number(quantity) || undefined,
      })
      setBundles(res.filtered_certificate_bundles ?? [])
    } catch (e: any) {
      setError(e?.message || 'Failed to query bundles. Ensure your BRC100 wallet (JSON API) is running and you have issued at least one GC.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-query on mount to populate any existing bundles
    handleQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        EnergyTag — Pushdrop Adapter (Mock)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Issue, query and redeem mock EnergyTag Granular Certificates backed by Pushdrop tokens.
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField
            label="Description"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            label="Sats"
            type="number"
            fullWidth
            value={sats}
            onChange={(e) => setSats(Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={1}>
          <TextField
            label="Qty"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Grid>
      </Grid>

      {/* Action buttons */}
      <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Grid item xs={12} sm={'auto' as any}>
          <Button variant="contained" onClick={handleIssue} disabled={loading}>
            Create (Issue)
          </Button>
        </Grid>
        <Grid item xs={12} sm={'auto' as any}>
          <Button variant="outlined" onClick={handleQuery} disabled={loading}>
            Query Bundles
          </Button>
        </Grid>
        <Grid item xs={12} sm={'auto' as any}>
          <Button variant="outlined" color="secondary" onClick={handleLoadMarket} disabled={loading}>
            Load Marketplace
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Bundles ({bundles.length})
        </Typography>
        <Stack spacing={1}>
          {bundles.map((b, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                <Chip size="small" label={`Device: ${b.device_name}`} />
                <Chip size="small" label={`Qty: ${b.bundle_quantity}`} />
                <Chip size="small" label={`Status: ${b.certificate_status}`} />
                <Chip size="small" label={`Face: ${b.face_value} Wh`} />
                <Chip size="small" label={`Issuance: ${b.issuance_id ?? 'n/a'}`} />
                <Chip size="small" label={`Period: ${b.production_starting_interval} → ${b.production_ending_interval}`} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" color="success" variant="contained" disabled={loading} onClick={async () => { await redeemBundle(b); await handleQuery(); }}>Redeem</Button>
                <Button size="small" color="info" variant="outlined" disabled={loading} onClick={async () => {
                  try {
                    setLoading(true)
                    setError('')
                    await publishBundle(b)
                    // Optionally re-query to reflect overlay-published state if applicable
                  } catch (e: any) {
                    setError(e?.message || 'Failed to publish to overlay')
                  } finally {
                    setLoading(false)
                  }
                }}>Publish</Button>
              </Stack>
            </Paper>
          ))}
          {bundles.length === 0 && <Typography variant="body2">No bundles yet. Issue or query to get started.</Typography>}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Marketplace (Overlay)</Typography>
        {marketOutputs.length === 0 && <Typography variant="body2">No overlay entries loaded. Click "Load Marketplace".</Typography>}
        <Grid container spacing={2}>
          {decodedMarket.map((d, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Listing #{idx}</Typography>
                {d.error ? (
                  <Alert severity="warning">Decode error: {d.error}</Alert>
                ) : (
                  <Stack spacing={0.5}>
                    <Typography variant="body2">outputIndex: {d.outputIndex}</Typography>
                    <Typography variant="body2">issuance_id: {d.issuance_id || 'n/a'}</Typography>
                    <Typography variant="body2">device: {d.device_name || 'n/a'}</Typography>
                    <Typography variant="body2">qty: {d.bundle_quantity ?? 'n/a'}</Typography>
                    <Typography variant="body2">face: {d.face_value ?? 'n/a'} Wh</Typography>
                    <Typography variant="body2">status: {d.certificate_status || 'n/a'}</Typography>
                    <Typography variant="body2">period: {d.production_starting_interval || 'n/a'} → {d.production_ending_interval || 'n/a'}</Typography>
                  </Stack>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  )
}

export default EnergyTagPanel
