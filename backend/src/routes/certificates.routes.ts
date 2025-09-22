import { Router } from 'express'
// Use .js extension for ESM runtime resolution after compilation
import { issueBundle, listBundles, redeemOne } from '../services/certificates.service.js'
import type { GranularCertificateQuery, GranularCertificateClaim, GranularCertificateCancellation } from '../types/energyTag'

const router = Router()

router.post('/certificates/issue', async (req, res) => {
  try {
    const { name, description, sats } = req.body || {}
    if (!name || !description || typeof sats !== 'number') {
      return res.status(400).json({ error: 'name, description, sats are required' })
    }
    const result = await issueBundle({ name, description, sats })
    console.log('[certificates.issue] success', { name, sats, issuance_ids: (result as any)?.filtered_certificate_bundles?.map((b: any) => b?.issuance_id).filter(Boolean) })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to issue bundle' })
  }
})

router.get('/certificates/query', async (req, res) => {
  try {
    const query = req.query as unknown as GranularCertificateQuery
    const result = await listBundles(query)
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to query bundles' })
  }
})

router.post('/certificates/claim', async (req, res) => {
  try {
    const input = req.body as GranularCertificateClaim
    const result = await redeemOne(input)
    console.log('[certificates.claim] success', { qty: input?.certificate_quantity, issuance_id: input?.source_certificate_issuance_id })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to claim' })
  }
})

router.post('/certificates/cancel', async (req, res) => {
  try {
    const input = req.body as GranularCertificateCancellation
    const result = await redeemOne(input)
    console.log('[certificates.cancel] success', { qty: input?.certificate_quantity, issuance_id: (input as any)?.source_certificate_issuance_id })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to cancel' })
  }
})

export default router
