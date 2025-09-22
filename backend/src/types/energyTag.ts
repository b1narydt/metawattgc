export type UUID = string;

export type CertificateStatus =
  | 'Active'
  | 'Cancelled'
  | 'Claimed'
  | 'Expired'
  | 'Withdrawn'
  | 'Locked'
  | 'Reserved';

export interface LatLngTuple extends Array<number> {
  0: number;
  1: number;
}

export interface GranularCertificateBundle {
  certificate_status: CertificateStatus;
  account_id: UUID;
  bundle_id_range_start: number;
  bundle_id_range_end: number;
  bundle_quantity: number;
  energy_carrier: string;
  energy_source: string;
  face_value: number;
  issuance_post_energy_carrier_conversion: boolean;
  registry_configuration: number;
  device_id: UUID;
  device_name: string;
  device_technology_type: string;
  device_production_start_date: string; // date
  device_capacity: number;
  device_location: LatLngTuple;
  device_type: string;
  production_starting_interval: string; // datetime
  production_ending_interval: string; // datetime
  issuance_datestamp: string; // date
  expiry_datestamp: string; // date
  country_of_issuance: string;
  connected_grid_identification: string;
  issuing_body: string;
  issue_market_zone: string;
  issuance_id?: UUID;
}

export interface GranularCertificateQuery {
  source_account_id: UUID;
  source_user_id: UUID;
  certificate_period_start?: string;
  certificate_period_end?: string;
  certificate_quantity?: number;
  certificate_status?: CertificateStatus | string;
  device_id?: UUID;
  energy_source?: string[];
  source_certificate_bundle_id_range_start?: number;
  source_certificate_bundle_id_range_end?: number;
  source_certificate_issuance_id?: UUID;
  sparse_filter_list?: Record<UUID, string>;
}

export interface GranularCertificateQueryResponse extends GranularCertificateQuery {
  action_request_datetime?: string;
  action_completed_datetime?: string;
  action_response_status: string;
  filtered_certificate_bundles?: GranularCertificateBundle[];
}

export interface GranularCertificateActionBase {
  source_account_id: UUID;
  source_user_id: UUID;
  certificate_period_start?: string;
  certificate_period_end?: string;
  certificate_quantity?: number;
  certificate_status?: CertificateStatus | string;
  device_id?: UUID;
  energy_source?: string[];
  source_certificate_bundle_id_range_start?: number;
  source_certificate_bundle_id_range_end?: number;
  source_certificate_issuance_id?: UUID;
  sparse_filter_list?: Record<UUID, string>;
}

export interface GranularCertificateClaim extends GranularCertificateActionBase {}
export interface GranularCertificateCancellation extends GranularCertificateActionBase {}

export interface GranularCertificateActionResponse extends GranularCertificateActionBase {
  action_request_datetime: string;
  action_completed_datetime?: string;
  action_response_status: string;
}
