import { Router } from 'express'
import type { Request, Response } from 'express'
import { WalletClient } from '@bsv/sdk'

const router = Router()
const walletClient = new WalletClient('json-api', 'localhost')

// Light-weight wallet warmup that mirrors the prior frontend loadCards() call.
// It fetches outputs from the 'metawatt-gc' basket to ensure wallet state is ready.
router.post('/wallet/loadBundles', async (_req: Request, res: Response) => {
  try {
    const t0 = Date.now()
    const r = await walletClient.listOutputs({
      basket: 'metawatt-gc',
      include: 'entire transactions',
      includeCustomInstructions: true,
    })
    const count = Array.isArray(r.outputs) ? r.outputs.length : 0
    const ms = Date.now() - t0
    console.log('[wallet.loadBundles] success', { basket: 'metawatt-gc', outputs: count, durationMs: ms })
    res.json({ ok: true, outputs: count })
  } catch (e: any) {
    console.warn('[wallet.loadBundles] failed', { error: e?.message })
    res.status(500).json({ ok: false, error: e?.message || 'wallet load failed' })
  }
})

export default router
