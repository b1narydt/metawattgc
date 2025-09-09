// EnergyTag TypeScript interfaces (initial subset)
// Source: EnergyTag API standard (schemas excerpted from user-provided spec)

export type UUID = string;

// Accounts
export interface AccountBase {
  account_name: string;
  organisation_id: UUID;
}

export interface Account extends AccountBase {
  account_id?: UUID; // present on read
}

export interface AccountRead extends AccountBase {
  account_id: UUID;
  // organisation and users can be expanded later when needed
}

export interface AccountUpdate {
  account_id?: UUID;
  account_name?: string;
  organisation_id: UUID; // required
  user_id?: UUID;
}

// Devices
export interface DeviceBase {
  account_id: UUID;
  capacity: number;
  device_name: string;
  energy_source: string;
  grid: string;
  location_id: UUID;
  operational_date: string; // date
  peak_demand: number;
  technology_type: string;
}

export interface DeviceRead extends Omit<DeviceBase, 'location_id'> {
  device_id: UUID;
  location_id: UUID;
}

export interface DeviceUpdate {
  account_id: UUID; // required
  device_id?: UUID;
  device_name?: string;
  energy_source?: string;
  grid?: string;
  location_id?: UUID;
  meter_id?: UUID;
  capacity?: number;
  operational_date?: string; // date
  peak_demand?: number;
  technology_type?: string;
}

// Granular Certificate Bundle
export type CertificateStatus =
  | 'Active'
  | 'Cancelled'
  | 'Claimed'
  | 'Expired'
  | 'Withdrawn'
  | 'Locked'
  | 'Reserved';

export interface LatLngTuple extends Array<number> {
  0: number; // lat
  1: number; // lng
}

export interface GranularCertificateBundle {
  certificate_status: CertificateStatus;
  account_id: UUID;
  bundle_id_range_start: number;
  bundle_id_range_end: number;
  bundle_quantity: number;
  energy_carrier: string; // Electricity in v2
  energy_source: string; // e.g. Solar, Wind
  face_value: number; // Wh per certificate
  issuance_post_energy_carrier_conversion: boolean;
  registry_configuration: number; // 1,2,3
  device_id: UUID;
  device_name: string;
  device_technology_type: string;
  device_production_start_date: string; // date
  device_capacity: number; // W
  device_location: LatLngTuple;
  device_type: string; // generation vs storage release
  production_starting_interval: string; // datetime
  production_ending_interval: string; // datetime
  issuance_datestamp: string; // date
  expiry_datestamp: string; // date
  country_of_issuance: string;
  connected_grid_identification: string;
  issuing_body: string;
  issue_market_zone: string;
  // Optional fields from spec
  discharging_start_datetime?: string;
  discharging_end_datetime?: string;
  dissemination_level?: string;
  emissions_factor_production_device?: number;
  emissions_factor_source?: string;
  issuance_purpose?: string;
  legal_status?: string;
  quality_scheme_reference?: string;
  sdr_allocation_id?: UUID;
  storage_device_id?: UUID;
  storage_device_location?: LatLngTuple;
  storage_efficiency_factor?: number;
  support_received?: string;
  issuance_id?: UUID; // spec says unique ID per bundle issuance
}

// Query and Responses
export interface GranularCertificateQuery {
  source_account_id: UUID;
  source_user_id: UUID;
  certificate_period_start?: string; // datetime
  certificate_period_end?: string; // datetime
  certificate_quantity?: number;
  certificate_status?: CertificateStatus | string;
  device_id?: UUID;
  energy_source?: string[];
  source_certificate_bundle_id_range_start?: number;
  source_certificate_bundle_id_range_end?: number;
  source_certificate_issuance_id?: UUID;
  sparse_filter_list?: Record<UUID, string>; // device_id -> datetime
}

export interface GranularCertificateQueryResponse extends GranularCertificateQuery {
  action_request_datetime?: string;
  action_completed_datetime?: string;
  action_response_status: string; // Accepted/Rejected
  filtered_certificate_bundles?: GranularCertificateBundle[];
}

// Claim / Cancellation
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

export interface GranularCertificateCancellation extends GranularCertificateActionBase {
  beneficiary?: string;
}

export interface GranularCertificateActionResponse extends GranularCertificateActionBase {
  action_request_datetime: string;
  action_completed_datetime?: string;
  action_response_status: string;
}
