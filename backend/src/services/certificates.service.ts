import { WalletClient, Utils, PushDrop, Transaction, LockingScript, WalletProtocol } from '@bsv/sdk'
import { v4 as uuidv4 } from 'uuid'
import type {
  GranularCertificateBundle,
  GranularCertificateQuery,
  GranularCertificateQueryResponse,
  GranularCertificateClaim,
  GranularCertificateCancellation,
  GranularCertificateActionResponse,
  UUID,
} from '../types/energyTag'

const walletClient = new WalletClient('json-api', 'localhost')
const pushdrop = new PushDrop(walletClient)
const PROTOCOL_ID: WalletProtocol = [1, 'metawatt gc']
const BASKET_NAME = 'metawatt-gc'

export async function issueBundle(params: {
  name: string
  description: string
  sats: number
}): Promise<GranularCertificateQueryResponse> {
  const keyID = uuidv4()
  const issuanceId = uuidv4()
  const now = new Date()
  const nowISO = now.toISOString()
  const today = nowISO.slice(0, 10)
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const energyTag: GranularCertificateBundle = {
    certificate_status: 'Active',
    account_id: '00000000-0000-0000-0000-000000000000',
    bundle_id_range_start: 1,
    bundle_id_range_end: 1,
    bundle_quantity: 1,
    energy_carrier: 'Electricity',
    energy_source: 'Unknown',
    face_value: Number(params.sats) || 1,
    issuance_post_energy_carrier_conversion: false,
    registry_configuration: 1,
    device_id: '00000000-0000-0000-0000-000000000000',
    device_name: params.name,
    device_technology_type: 'Unknown',
    device_production_start_date: today,
    device_capacity: 0,
    device_location: [0, 0],
    device_type: 'generation',
    production_starting_interval: nowISO,
    production_ending_interval: nowISO,
    issuance_datestamp: today,
    expiry_datestamp: oneYearLater,
    country_of_issuance: 'N/A',
    connected_grid_identification: 'N/A',
    issuing_body: 'MetawattGC',
    issue_market_zone: 'N/A',
    issuance_id: issuanceId,
  }

  const payload = Utils.toArray(JSON.stringify({ energyTag, note: params.description }))

  const lockingScript = await pushdrop.lock(
    [payload],
    PROTOCOL_ID,
    keyID,
    'self',
    true
  )

  const satoshis = Number(params.sats)
  const result = await walletClient.createAction({
    description: 'Issue GC',
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis,
        outputDescription: 'metawatt-gc bundle',
        basket: BASKET_NAME,
        customInstructions: JSON.stringify({ keyID, issuance_id: issuanceId }),
      },
    ],
    options: { randomizeOutputs: false, acceptDelayedBroadcast: false },
  })

  const response: GranularCertificateQueryResponse = {
    source_account_id: '00000000-0000-0000-0000-000000000000',
    source_user_id: '00000000-0000-0000-0000-000000000000',
    action_request_datetime: new Date().toISOString(),
    action_completed_datetime: new Date().toISOString(),
    action_response_status: 'Accepted',
    filtered_certificate_bundles: [energyTag],
  }
  return response
}

export async function listBundles(query: GranularCertificateQuery): Promise<GranularCertificateQueryResponse> {
  const { outputs, BEEF } = await walletClient.listOutputs({
    basket: BASKET_NAME,
    include: 'entire transactions',
    includeCustomInstructions: true,
  })

  const bundles: GranularCertificateBundle[] = []

  for (const entry of outputs) {
    try {
      const [txid, voutStr] = entry.outpoint.split('.')
      const vout = parseInt(voutStr, 10)
      if (!BEEF || Number.isNaN(vout)) continue

      const tx = Transaction.fromBEEF(BEEF, txid)
      const output = tx.outputs[vout]
      if (!output) continue

      const script = output.lockingScript
      const decoded = PushDrop.decode(script)
      if (!decoded.fields || decoded.fields.length === 0) continue
      const payload = JSON.parse(Utils.toUTF8(decoded.fields[0]))
      if (payload?.energyTag) {
        bundles.push(payload.energyTag as GranularCertificateBundle)
      }
    } catch (e) {
      continue
    }
  }

  // naive filters: quantity only
  let selected = bundles
  if (query.certificate_quantity && query.certificate_quantity > 0) {
    selected = bundles.slice(0, query.certificate_quantity)
  }

  return {
    ...query,
    action_request_datetime: new Date().toISOString(),
    action_completed_datetime: new Date().toISOString(),
    action_response_status: 'Accepted',
    filtered_certificate_bundles: selected,
  }
}

export async function redeemOne(input: GranularCertificateClaim | GranularCertificateCancellation): Promise<GranularCertificateActionResponse> {
  const { outputs, BEEF } = await walletClient.listOutputs({
    basket: BASKET_NAME,
    include: 'entire transactions',
    includeCustomInstructions: true,
  })
  if (!BEEF || outputs.length === 0) {
    throw new Error('No outputs to redeem')
  }

  // Try to find a specific UTXO by issuance_id if provided
  const targetIssuance = (input as any).source_certificate_issuance_id as string | undefined
  let chosen = outputs[0]
  if (targetIssuance) {
    for (const entry of outputs) {
      try {
        // First check customInstructions metadata (fast path)
        if (entry.customInstructions) {
          const meta = JSON.parse(entry.customInstructions)
          if (meta?.issuance_id && meta.issuance_id === targetIssuance) {
            chosen = entry
            break
          }
        }
        // Fallback: decode script payload and read energyTag.issuance_id
        const [txidX, voutXStr] = entry.outpoint.split('.')
        const voutX = parseInt(voutXStr, 10)
        const outX = Transaction.fromBEEF(BEEF, txidX).outputs[voutX]
        const decoded = PushDrop.decode(outX.lockingScript)
        if (decoded.fields && decoded.fields.length > 0) {
          const payloadStr = Utils.toUTF8(decoded.fields[0])
          const obj = JSON.parse(payloadStr)
          const et = obj?.energyTag
          if (et?.issuance_id && et.issuance_id === targetIssuance) {
            chosen = entry
            break
          }
        }
      } catch {
        // ignore and continue scanning
      }
    }
  }

  const [txid, voutStr] = chosen.outpoint.split('.')
  const vout = parseInt(voutStr, 10)
  const output = Transaction.fromBEEF(BEEF, txid).outputs[vout]
  if (!output) throw new Error('Output not found in BEEF')
  const outputScript = output.lockingScript

  const meta = chosen.customInstructions ? JSON.parse(chosen.customInstructions) : { keyID: '' }
  const keyID = meta.keyID || ''
  if (!keyID) throw new Error('Missing keyID metadata for unlock')

  const unlocker = pushdrop.unlock(
    PROTOCOL_ID,
    keyID,
    'self',
    'all',
    false,
    chosen.satoshis,
    outputScript
  )

  const partial = await walletClient.createAction({
    description: 'Redeem GC',
    inputBEEF: BEEF,
    inputs: [
      {
        outpoint: chosen.outpoint,
        unlockingScriptLength: 73,
        inputDescription: 'metawatt gc',
      },
    ],
    options: { randomizeOutputs: false, acceptDelayedBroadcast: false },
  })

  if (!partial.signableTransaction) throw new Error('Signable tx missing')

  const unlockingScript = await unlocker.sign(
    Transaction.fromBEEF(partial.signableTransaction.tx),
    vout
  )

  await walletClient.signAction({
    reference: partial.signableTransaction.reference,
    spends: { [vout]: { unlockingScript: unlockingScript.toHex() } },
  })

  return {
    source_account_id: '00000000-0000-0000-0000-000000000000',
    source_user_id: '00000000-0000-0000-0000-000000000000',
    action_request_datetime: new Date().toISOString(),
    action_completed_datetime: new Date().toISOString(),
    action_response_status: 'Accepted',
  }
}
