import type { Db } from 'mongodb';
export interface UTXOReference {
    txid: string;
    outputIndex: number;
}
export interface MetawattRecord {
    txid: string;
    outputIndex: number;
    issuance_id?: string;
    account_id?: string;
    device_id?: string;
    device_name?: string;
    energy_source?: string;
    certificate_status?: string;
    face_value?: number;
    bundle_quantity?: number;
    production_starting_interval?: string;
    production_ending_interval?: string;
    createdAt: Date;
}
export declare class MetawattStorage {
    private readonly records;
    constructor(db: Db);
    storeRecordFromEnergyTag(txid: string, outputIndex: number, et: any): Promise<void>;
    deleteRecord(txid: string, outputIndex: number): Promise<number>;
    findAll(): Promise<UTXOReference[]>;
    findByIssuanceId(issuanceId: string): Promise<UTXOReference[]>;
    findByDevice(deviceId: string): Promise<UTXOReference[]>;
    findByPeriod(startISO?: string, endISO?: string): Promise<UTXOReference[]>;
}
