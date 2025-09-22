export class MetawattStorage {
    constructor(db) {
        this.records = db.collection('metawatt_gc');
        this.records.createIndex?.({ issuance_id: 1 });
        this.records.createIndex?.({ device_id: 1 });
        this.records.createIndex?.({ account_id: 1 });
        this.records.createIndex?.({ production_starting_interval: 1 });
    }
    async storeRecordFromEnergyTag(txid, outputIndex, et) {
        const doc = {
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
        };
        await this.records.updateOne({ txid, outputIndex }, { $set: doc }, { upsert: true });
    }
    async deleteRecord(txid, outputIndex) {
        return (await this.records.deleteMany({ txid, outputIndex })).deletedCount || 0;
    }
    async findAll() {
        const arr = await this.records.find({}, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray();
        return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }));
    }
    async findByIssuanceId(issuanceId) {
        const arr = await this.records.find({ issuance_id: issuanceId }, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray();
        return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }));
    }
    async findByDevice(deviceId) {
        const arr = await this.records.find({ device_id: deviceId }, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray();
        return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }));
    }
    async findByPeriod(startISO, endISO) {
        const q = {};
        if (startISO)
            q.production_starting_interval = { $gte: startISO };
        if (endISO) {
            if (!q.production_ending_interval)
                q.production_ending_interval = {};
            q.production_ending_interval.$lte = endISO;
        }
        const arr = await this.records.find(q, { projection: { _id: 0, txid: 1, outputIndex: 1 } }).toArray();
        return arr.map(r => ({ txid: r.txid, outputIndex: r.outputIndex }));
    }
}
