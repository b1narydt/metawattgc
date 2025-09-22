import 'dotenv/config'

// Ensure a full browser-like fetch environment for @bsv/sdk in Node
import {
  fetch as undiciFetch,
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse,
} from 'undici'

{
  const g = globalThis as any
  // Core fetch API
  g.fetch ??= undiciFetch as any
  g.Headers ??= UndiciHeaders as any
  g.Request ??= UndiciRequest as any
  g.Response ??= UndiciResponse as any
  // Some libs probe these names
  g.window ??= g
  g.self ??= g
}
// Ensure a global fetch (and related classes) is available for @bsv/sdk HTTP calls
// Prefer undici in Node for full fetch, Headers, Request, Response support
import OverlayExpress from '@bsv/overlay-express'
// Import local services (rewired to live under overlay-node/src/services)
import MetawattGCTopicManager from './services/MetawattGCTopicManager.js'
import MetawattLookupServiceFactory from './services/MetawattLookupServiceFactory.js'
import type { Db } from 'mongodb'


async function main() {
  const NAME = process.env.OVERLAY_NAME || 'MetawattGC Overlay'
  const PRIVATE_KEY = process.env.OVERLAY_PRIVATE_KEY || 'replace-with-wallet-private-key'
  const FQDN = process.env.OVERLAY_FQDN || 'localhost:4000'
  const PORT = Number(process.env.PORT || 4000)

  const MYSQL_URL = process.env.OVERLAY_MYSQL_URL || 'mysql://overlayAdmin:overlay123@localhost:3306/overlay'
  const MONGO_URL = process.env.OVERLAY_MONGO_URL || 'mongodb://localhost:27017'
  const NETWORK = (process.env.OVERLAY_NETWORK as 'main' | 'test') || 'main'
  const ARC_API_KEY = process.env.OVERLAY_ARC_API_KEY

  const ox = new OverlayExpress(NAME, PRIVATE_KEY, FQDN)
  ox.configurePort(PORT)
  ox.configureNetwork(NETWORK)
  if (ARC_API_KEY) ox.configureArcApiKey(ARC_API_KEY)

  await ox.configureKnex(MYSQL_URL)
  await ox.configureMongo(MONGO_URL)

  // Register Metawatt services
  ox.configureTopicManager('tm_metawatt_gc', new MetawattGCTopicManager())
  ox.configureLookupServiceWithMongo('ls_metawatt', (db: Db) => MetawattLookupServiceFactory(db))

  // DEBUG + compatibility shim for provider on /lookup
  try {
    const anyOx = ox as any
    const app = anyOx.app || anyOx.express || anyOx.server?.app || anyOx.server
    if (app && typeof app.use === 'function') {
      // Intercept and fully handle POST /lookup BEFORE overlay-express reads the body to avoid double-read.
      // This route consumes the body once and does NOT call next().
      // Use body-parser locally to parse JSON for just this route.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bodyParser = require('body-parser')
      app.post('/lookup', bodyParser.json(), async (req: any, res: any) => {
        try {
          const headers = req.headers || {}
          const query = req.query || {}
          const body = (req.body && typeof req.body === 'object') ? req.body : {}
          const provider = (headers['x-provider'] || headers['x-lookup-provider'] || headers['x-lookup-service'] || body.provider || body.providerName || body.lookupService || query.provider || 'ls_metawatt') as string
          console.log('[overlay.lookup] intercepted (handled here)', { provider, url: req.url })
          const engine = (ox as any).engine
          if (!engine) return res.status(503).json({ status: 'error', message: 'Engine not ready' })
          const result = await engine.lookup({ provider, ...body })
          return res.json(result)
        } catch (e: any) {
          console.warn('[overlay.lookup] handler error', e?.message)
          return res.status(400).json({ status: 'error', message: e?.message || 'Lookup failed' })
        }
      })

      // Log incoming lookup requests without touching the body stream
      app.use('/lookup', (req: any, _res: any, next: any) => {
        const headers = req.headers || {}
        const query = req.query || {}
        const providerHeader = headers['x-provider'] || headers['x-lookup-provider'] || headers['x-lookup-service']
        const providerQuery = query.provider
        const provider = providerHeader || providerQuery || 'ls_metawatt'
        console.log('[overlay.lookup] incoming (no-body-read)', {
          method: req.method,
          url: req.url,
          provider,
          headers: {
            'x-provider': req.headers['x-provider'],
            'x-lookup-provider': req.headers['x-lookup-provider'],
            'x-lookup-service': req.headers['x-lookup-service'],
          },
          query: req.query,
        })
        next()
      })
    }
  } catch (e) {
    console.warn('[overlay.lookup] debug middleware setup failed', e)
  }

  // Optional UI customization (use allowed UIConfig keys)
  ox.configureWebUI({
    host: `http://${FQDN}`,
    primaryColor: '#2E7D32',
    secondaryColor: '#1B5E20'
  })

  await ox.configureEngine(true)
  await ox.start()
}

main().catch((e) => {
  console.error('[overlay-node] fatal:', e)
  process.exit(1)
})
