import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import { Transaction, PushDrop, Utils } from '@bsv/sdk'

// Admits outputs whose PushDrop field[0] is JSON with an `energyTag` object containing required keys.
export default class MetawattGCTopicManager implements TopicManager {
  async identifyAdmissibleOutputs(beef: number[], previousCoins: number[]): Promise<AdmittanceInstructions> {
    const outputsToAdmit: number[] = []

    try {
      const tx = Transaction.fromBEEF(beef)
      for (const [index, out] of tx.outputs.entries()) {
        try {
          const decoded = PushDrop.decode(out.lockingScript)
          if (!decoded.fields || decoded.fields.length === 0) continue
          const payloadStr = Utils.toUTF8(decoded.fields[0])
          const payload = JSON.parse(payloadStr)
          if (payload && typeof payload === 'object' && payload.energyTag) {
            const et = payload.energyTag
            // minimal validation of EnergyTag bundle fields
            const hasCore = (
              typeof et.certificate_status === 'string' &&
              typeof et.account_id === 'string' &&
              typeof et.bundle_id_range_start === 'number' &&
              typeof et.bundle_id_range_end === 'number' &&
              typeof et.bundle_quantity === 'number' &&
              typeof et.energy_carrier === 'string' &&
              typeof et.energy_source === 'string' &&
              typeof et.face_value === 'number'
            )
            if (hasCore) outputsToAdmit.push(index)
          }
        } catch {
          // ignore outputs that fail to decode/parse
        }
      }
    } catch (err) {
      console.error('[MetawattGCTopicManager] identifyAdmissibleOutputs error:', err)
    }

    return { outputsToAdmit, coinsToRetain: previousCoins }
  }

  async getDocumentation(): Promise<string> {
    return 'Metawatt GC Topic Manager — admits PushDrop outputs embedding EnergyTag GranularCertificateBundle JSON.'
  }

  async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
    return {
      name: 'MetawattGC Topic Manager',
      shortDescription: 'Admits EnergyTag-compliant GC PushDrop outputs'
    }
  }
}
