import { Router } from 'express'
import { WalletClient, Transaction, PushDrop, Utils } from '@bsv/sdk'
import type { Request, Response } from 'express'

const router = Router()
const walletClient = new WalletClient('json-api', 'localhost')
const BASKET_NAME = 'metawatt-gc'
const TOPIC = 'tm_metawatt_gc'

router.post('/overlay/publish', async (req: Request, res: Response) => {
  try {
    const { source_certificate_issuance_id } = req.body || {}
    if (!source_certificate_issuance_id) return res.status(400).json({ error: 'source_certificate_issuance_id is required' })

    console.log('[overlay.publish] request', { source_certificate_issuance_id })

    const { outputs, BEEF } = await walletClient.listOutputs({
      basket: BASKET_NAME,
      include: 'entire transactions',
      includeCustomInstructions: true,
    })
    if (!BEEF) {
      console.warn('[overlay.publish] no BEEF returned by wallet')
      return res.status(404).json({ error: 'No BEEF available from wallet' })
    }

    // Find matching output
    const chosen = outputs.find((e: any) => {
      try {
        if (e.customInstructions) {
          const meta = JSON.parse(e.customInstructions)
          if (meta?.issuance_id === source_certificate_issuance_id) return true
        }
      } catch {}
      return false
    }) || null

    if (!chosen) {
      console.warn('[overlay.publish] no matching UTXO for issuance_id')
      return res.status(404).json({ error: 'No matching UTXO for issuance_id' })
    }

    const [txid, voutStr] = chosen.outpoint.split('.')
    const vout = parseInt(voutStr, 10)
    const beef = Transaction.fromBEEF(BEEF, txid).toBEEF()
    console.log('[overlay.publish] chosen outpoint', { outpoint: chosen.outpoint, vout })

    // Optionally push directly to overlay-express /submit if OVERLAY_PUBLISH_URL is provided
    const url = process.env.OVERLAY_PUBLISH_URL
    let overlayResult: any = { attempted: false }
    if (url) {
      try {
        // overlay-express expects raw BEEF as body and x-topics header JSON array of topic names
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-topics': JSON.stringify([TOPIC])
          },
          body: JSON.stringify(beef),
        })
        const text = await resp.text().catch(() => '')
        overlayResult = { attempted: true, url, status: resp.status, ok: resp.ok, body: text?.slice(0, 2000) }
        console.log('[overlay.publish] overlay submit response', overlayResult)
      } catch (e) {
        overlayResult = { attempted: true, url, error: (e as any)?.message }
        console.warn('[overlay.publish] overlay submit failed', overlayResult)
      }
    } else {
      console.info('[overlay.publish] OVERLAY_PUBLISH_URL not set; returning payload only')
    }

    // Return payload suitable for a LookupResolver or external publisher
    res.json({ topic: TOPIC, outputs: [{ beef, outputIndex: vout }], overlaySubmit: overlayResult })
  } catch (e: any) {
    console.error('[overlay.publish] unexpected error', e)
    res.status(500).json({ error: e?.message || 'Failed to publish to overlay' })
  }
})

export default router

// Additional proxy endpoints for overlay lookup
router.get('/overlay/listActiveOutputs', async (_req: Request, res: Response) => {
  try {
    const url = process.env.OVERLAY_LOOKUP_URL || process.env.OVERLAY_PUBLISH_URL?.replace('/submit', '/lookup') || 'http://localhost:4000/lookup'
    const headers = {
      'Content-Type': 'application/json',
      'x-lookup-service': 'ls_metawatt',
      // Some overlay-express versions expect 'x-provider' header
      'x-provider': 'ls_metawatt',
      // Some versions use 'x-lookup-provider'
      'x-lookup-provider': 'ls_metawatt',
      // Some versions read plain 'provider' header
      'provider': 'ls_metawatt',
    } as Record<string, string>
    const body = { query: 'listActiveOutputs', provider: 'ls_metawatt', providerName: 'ls_metawatt', lookupService: 'ls_metawatt' }
    console.log('[backend.lookup:listActiveOutputs] request', { url, headers, body })
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      console.warn('[backend.lookup:listActiveOutputs] response not ok', { status: r.status, text: t })
      return res.status(502).json({ error: `Overlay lookup failed: ${t || r.status}` })
    }
    const data = await r.json()
    console.log('[backend.lookup:listActiveOutputs] response ok', { data })
    res.json(data)
  } catch (e: any) {
    console.error('[backend.lookup:listActiveOutputs] exception', { error: e?.message })
    res.status(500).json({ error: e?.message || 'Failed overlay listActiveOutputs' })
  }
})

router.post('/overlay/lookup', async (req: Request, res: Response) => {
  try {
    const url = process.env.OVERLAY_LOOKUP_URL || process.env.OVERLAY_PUBLISH_URL?.replace('/submit', '/lookup') || 'http://localhost:4000/lookup'
    const headers = {
      'Content-Type': 'application/json',
      'x-lookup-service': 'ls_metawatt',
      'x-provider': 'ls_metawatt',
      'x-lookup-provider': 'ls_metawatt',
      'provider': 'ls_metawatt',
    } as Record<string, string>
    const body = { provider: 'ls_metawatt', providerName: 'ls_metawatt', lookupService: 'ls_metawatt', ...(req.body || {}) }
    console.log('[backend.lookup:generic] request', { url, headers, body })
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      console.warn('[backend.lookup:generic] response not ok', { status: r.status, text: t })
      return res.status(502).json({ error: `Overlay lookup failed: ${t || r.status}` })
    }
    const data = await r.json()
    console.log('[backend.lookup:generic] response ok', { data })
    res.json(data)
  } catch (e: any) {
    console.error('[backend.lookup:generic] exception', { error: e?.message })
    res.status(500).json({ error: e?.message || 'Failed overlay lookup' })
  }
})
