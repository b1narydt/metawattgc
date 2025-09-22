import { AdmissionMode, LookupService, OutputAdmittedByTopic, OutputSpent, SpendNotificationMode } from '@bsv/overlay'
import { PushDrop, Utils, Transaction } from '@bsv/sdk'
import type { Db, Collection } from 'mongodb'
import mysql from 'mysql2/promise'

interface MetawattRecord {
  txid: string
  outputIndex: number
  issuance_id?: string
  device_name?: string
  bundle_quantity?: number
  face_value?: number
  certificate_status?: string
  production_starting_interval?: string
  production_ending_interval?: string
  createdAt: Date
}

class MetawattLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'
  records: Collection<MetawattRecord>
  mysqlPool: mysql.Pool

  constructor(db: Db) {
    this.records = db.collection<MetawattRecord>('metawatt_gc')
    this.mysqlPool = mysql.createPool({
      host: process.env.OVERLAY_MYSQL_HOST || 'mysql',
      port: Number(process.env.OVERLAY_MYSQL_PORT || 3306),
      user: process.env.OVERLAY_MYSQL_USER || 'overlayAdmin',
      password: process.env.OVERLAY_MYSQL_PASSWORD || 'overlay123',
      database: process.env.OVERLAY_MYSQL_DB || 'overlay',
      connectionLimit: 4,
    })
  }

  async getDocumentation(): Promise<string> {
    return 'Metawatt Lookup Service — stores EnergyTag GC references and provides overlay-compatible lookups.'
  }

  async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
    return {
      name: 'Metawatt Lookup Service',
      shortDescription: 'Lookup resolver for EnergyTag GC PushDrop outputs',
    }
  }

  async outputAdmittedByTopic(payload: OutputAdmittedByTopic) {
    if (payload.mode !== 'locking-script') throw new Error('Invalid payload')
    const { topic, txid, outputIndex, lockingScript } = payload
    if (topic !== 'tm_metawatt_gc') return

    try {
      const decoded = PushDrop.decode(lockingScript)
      if (!decoded.fields || decoded.fields.length === 0) return
      const payloadStr = Utils.toUTF8(decoded.fields[0])
      const obj = JSON.parse(payloadStr)
      const et = obj?.energyTag
      if (!et) return

      await (this.records as unknown as Collection<any>).updateOne(
        { txid, outputIndex },
        {
          $set: {
            txid,
            outputIndex,
            issuance_id: et.issuance_id,
            device_name: et.device_name,
            bundle_quantity: et.bundle_quantity,
            face_value: et.face_value,
            certificate_status: et.certificate_status,
            production_starting_interval: et.production_starting_interval,
            production_ending_interval: et.production_ending_interval,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      )
    } catch {
      // ignore malformed outputs
    }
  }

  async outputSpent(payload: OutputSpent) {
    if (payload.mode !== 'none') throw new Error('Invalid payload')
    const { topic, txid, outputIndex } = payload
    if (topic !== 'tm_metawatt_gc') return
    await (this.records as unknown as Collection<any>).deleteOne({ txid, outputIndex })
  }

  async outputEvicted(txid: string, outputIndex: number) {
    await (this.records as unknown as Collection<any>).deleteOne({ txid, outputIndex })
  }

  async lookup(question: any): Promise<any> {
    const q = (question as any).query
    if (!q) throw new Error('A valid query must be provided')

    if (q === 'all') {
      return await (this.records as unknown as Collection<any>)
        .find({}, { projection: { _id: 0, txid: 1, outputIndex: 1 } })
        .toArray()
    }

    if (q === 'listActiveOutputs') {
      const refs: Array<{ txid: string; outputIndex: number }> = await (this.records as unknown as Collection<any>)
        .find({}, { projection: { _id: 0, txid: 1, outputIndex: 1 } })
        .toArray()

      const outputs: Array<{ beef: number[]; outputIndex: number }> = []
      for (const { txid, outputIndex } of refs) {
        try {
          const txHex = await this.fetchTxHex(txid)
          if (!txHex) continue
          const beef = Transaction.fromHex(txHex).toBEEF()
          outputs.push({ beef, outputIndex })
        } catch {
          // skip
        }
      }
      return { type: 'output-list', outputs }
    }

    if (typeof q === 'object' && q.type === 'byIssuanceId' && typeof q.value === 'string') {
      const doc = await (this.records as unknown as Collection<any>).findOne(
        { issuance_id: q.value },
        { projection: { _id: 0, txid: 1, outputIndex: 1 } }
      )
      return doc ? [doc] : []
    }

    return []
  }

  private async fetchTxHex(txid: string): Promise<string | null> {
    const conn = await this.mysqlPool.getConnection()
    try {
      const tryQueries = [
        'SELECT `raw` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
        'SELECT `hex` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
        'SELECT `tx_hex` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
        'SELECT `transaction_hex` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
        'SELECT `tx` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
        'SELECT `transaction` AS v FROM `transactions` WHERE `txid` = ? LIMIT 1',
      ]
      for (const sql of tryQueries) {
        const [rows] = await conn.query(sql, [txid])
        const arr = rows as Array<Record<string, any>>
        if (arr.length > 0) {
          const raw = arr[0]?.v
          if (typeof raw === 'string') return raw
          if (raw && Buffer.isBuffer(raw)) return raw.toString('hex')
        }
      }
      return null
    } finally {
      conn.release()
    }
  }
}

export default (db: Db) => new MetawattLookupService(db)
