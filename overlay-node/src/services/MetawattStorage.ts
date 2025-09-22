import type { Collection, Db } from 'mongodb'

export interface UTXOReference { txid: string; outputIndex: number }

export interface MetawattRecord {
  txid: string
  outputIndex: number
  issuance_id?: string
  account_id?: string
  device_id?: string
  device_name?: string
  energy_source?: string
  certificate_status?: string
  face_value?: number
  bundle_quantity?: number
  production_starting_interval?: string
  production_ending_interval?: string
  createdAt: Date
}

export class MetawattStorage {
  private readonly records: Collection<MetawattRecord>

  constructor(db: Db) {
    this.records = db.collection<MetawattRecord>('metawatt_gc')
    this.records.createIndex?.({ issuance_id: 1 })
    this.records.createIndex?.({ device_id: 1 })
    this.records.createIndex?.({ account_id: 1 })
    this.records.createIndex?.({ production_starting_interval: 1 })
  }

  async storeRecordFromEnergyTag(txid: string, outputIndex: number, et: any): Promise<void> {
    const doc: MetawattRecord = {
      txid,
      outputIndex,
      issuance_id: et.issuance_id,
      account_id: et.account_id,
      device_id: et.device_id,
      device_name: et.device_name,
      energy_source: et.energy_source,
      certificate_status: et.certificate_status,
      face_value: et.face_value,
      bundle_quantity: et.bundle_quantity,
      production_starting_interval: et.production_starting_interval,
      production_ending_interval: et.production_ending_interval,
      createdAt: new Date(),
    }
    await this.records.updateOne({ txid, outputIndex }, { $set: doc }, { upsert: true })
  }

  async deleteRecord(txid: string, outputIndex: number): Promise<number> {
    return (await this.records.deleteMany({ txid, outputIndex })).deletedCount || 0
  }

  async findAll(): Promise<UTXOReference[]> {
    const arr = await this.records.find({}, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray()
    return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }))
  }

  async findByIssuanceId(issuanceId: string): Promise<UTXOReference[]> {
    const arr = await this.records.find({ issuance_id: issuanceId }, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray()
    return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }))
  }

  async findByDevice(deviceId: string): Promise<UTXOReference[]> {
    const arr = await this.records.find({ device_id: deviceId }, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray()
    return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }))
  }

  async findByPeriod(startISO?: string, endISO?: string): Promise<UTXOReference[]> {
    const q: any = {}
    if (startISO) q.production_starting_interval = { $gte: startISO }
    if (endISO) {
      if (!q.production_ending_interval) q.production_ending_interval = {}
      q.production_ending_interval.$lte = endISO
    }
    const arr = await this.records.find(q, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray()
    return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }))
  }
}
