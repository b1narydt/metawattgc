import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import type { Request, Response } from 'express'
// Use .js extension in import paths so ESM runtime can resolve compiled files from dist/
import certificates from './routes/certificates.routes.js'
import overlay from './routes/overlay.routes.js'
import wallet from './routes/wallet.routes.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))
app.use('/api', certificates)
app.use('/api', overlay)
app.use('/api', wallet)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[metawattgc-backend] listening on port ${PORT}`)
})
