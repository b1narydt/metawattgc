import type {
  GranularCertificateBundle,
  GranularCertificateQuery,
  GranularCertificateQueryResponse,
  GranularCertificateClaim,
  GranularCertificateCancellation,
  GranularCertificateActionResponse,
} from '../types/energyTag'
import { apiGet, apiPost } from './client'

// Backend-backed API
export async function queryBundles(
  query: GranularCertificateQuery
): Promise<GranularCertificateQueryResponse> {
  return apiGet<GranularCertificateQueryResponse>('/api/certificates/query', query as any)
}

export async function issueMockBundle(params: {
  name: string
  description: string
  sats: number
}): Promise<GranularCertificateQueryResponse> {
  return apiPost<GranularCertificateQueryResponse>('/api/certificates/issue', params)
}

export async function claim(
  input: GranularCertificateClaim
): Promise<GranularCertificateActionResponse> {
  return apiPost<GranularCertificateActionResponse>('/api/certificates/claim', input)
}

export async function cancel(
  input: GranularCertificateCancellation
): Promise<GranularCertificateActionResponse> {
  return apiPost<GranularCertificateActionResponse>('/api/certificates/cancel', input)
}

// Redeem a specific bundle: for now call claim with issuance hint (backend may ignore until implemented)
export async function redeemBundle(
  bundle: GranularCertificateBundle
): Promise<GranularCertificateActionResponse> {
  const input: GranularCertificateClaim = {
    source_account_id: '00000000-0000-0000-0000-000000000000',
    source_user_id: '00000000-0000-0000-0000-000000000000',
    certificate_quantity: 1,
    source_certificate_issuance_id: bundle.issuance_id,
  }
  return claim(input)
}

// Publish a bundle's UTXO to the overlay topic via backend
export async function publishBundle(
  bundle: GranularCertificateBundle
): Promise<{ topic: string; outputs: Array<{ beef: number[]; outputIndex: number }> }> {
  return apiPost('/api/overlay/publish', {
    source_certificate_issuance_id: bundle.issuance_id,
  })
}

// Overlay lookup helpers
export async function listActiveOutputs(): Promise<{ type: string; outputs: { beef: number[]; outputIndex: number }[] }> {
  return apiGet('/api/overlay/listActiveOutputs')
}

export async function decodeOutputs(
  outputs: { beef: number[]; outputIndex: number }[]
): Promise<{ items: Array<{
  outputIndex: number;
  issuance_id?: string;
  device_name?: string;
  bundle_quantity?: number;
  face_value?: number;
  certificate_status?: string;
  production_starting_interval?: string;
  production_ending_interval?: string;
  error?: string;
}> }> {
  return apiPost('/api/overlay/decode', { outputs })
}

// Backend-driven wallet warmup replacing frontend loadCards()
export async function walletLoadBundles(): Promise<{ ok: boolean; outputs?: number; error?: string }> {
  return apiPost('/api/wallet/loadBundles', {})
}
