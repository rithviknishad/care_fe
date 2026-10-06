export type CareContextStatus =
  | "pending"
  | "awaiting_token"
  | "linking"
  | "linked"
  | "failed";

export type ExchangeState =
  | "sent"
  | "accepted"
  | "answered"
  | "refused"
  | "received"
  | "replied"
  | "rejected";

export interface AbdmExchange {
  id: string;
  request_id: string;
  direction: "outbound" | "inbound";
  path: string;
  hip_id: string;
  state: ExchangeState;
  http_status: number | null;
  error_code: string;
  error_message: string;
  headers: Record<string, number>;
  created_date: string;
  answered_at: string | null;
  answered_by: AbdmExchange | null;
}

export interface AbdmCareContext {
  status: CareContextStatus | null;
  reference_number?: string;
  display?: string;
  abha_address?: string;
  hi_types?: string[];
  linked_hi_types?: string[];
  linked_at?: string | null;
  error_code?: string;
  error_message?: string;
  modified_date?: string;
  stale_after_seconds?: number;
  exchanges?: AbdmExchange[];
}

export interface AbdmFacilitySettings {
  hip_id: string | null;
}

export interface AbdmReadiness {
  hip_id: string | null;
  bridge_url: string | null;
  hip_registered: boolean;
  hiu_registered: boolean;
  callback_base_url: string | null;
  error?: string;
}

export interface AbdmPatientCareContext {
  encounter: string;
  facility: string;
  facility_name: string;
  reference_number: string;
  display: string;
  hip_id: string;
  abha_address: string;
  status: CareContextStatus;
  hi_types: string[];
  linked_hi_types: string[];
  linked_at: string | null;
  notified_at: string | null;
  error_code: string;
  error_message: string;
  modified_date: string;
}

export interface AbdmTransferStatus {
  careContextReference: string;
  hiStatus: string;
  description?: string;
}

export interface AbdmTransfer {
  transaction_id: string;
  session_status: string;
  status_responses: AbdmTransferStatus[];
  error_message: string;
  created_date: string;
  record_count: number;
}

export interface AbdmConsent {
  consent_id: string;
  status: string;
  hip_id: string;
  requester: string | null;
  purpose: string | null;
  hi_types: string[];
  care_context_references: string[];
  date_from: string | null;
  date_to: string | null;
  data_erase_at: string | null;
  created_date: string;
  modified_date: string;
  transfers: AbdmTransfer[];
}

export interface AbdmPatientOverview {
  abha_number: string | null;
  abha_address: string | null;
  care_contexts: AbdmPatientCareContext[];
  consents: AbdmConsent[];
  consent_requests: AbdmConsentRequest[];
}

export const ABDM_PURPOSES = [
  "CAREMGT",
  "BTG",
  "PUBHLTH",
  "HPAYMT",
  "DSRCH",
  "PATRQT",
] as const;

// The HI types ABDM-1006 names as the ones it accepts
export const ABDM_HI_TYPES = [
  "Prescription",
  "DiagnosticReport",
  "OPConsultation",
  "DischargeSummary",
  "ImmunizationRecord",
  "HealthDocumentRecord",
  "WellnessRecord",
  "Invoice",
] as const;

export type AbdmConsentRequestStatus =
  | "SENDING"
  | "FAILED"
  | "REQUESTED"
  | "GRANTED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED";

export interface AbdmReceivedArtefact {
  consent_id: string;
  status: AbdmConsentRequestStatus;
  hip_id: string;
  hip_name: string;
  hi_types: string[];
  care_context_count: number;
  date_from: string | null;
  date_to: string | null;
  data_erase_at: string | null;
  session_status: string;
  status_responses: AbdmTransferStatus[];
  error_code: string;
  error_message: string;
  record_count: number;
  modified_date: string;
}

export interface AbdmConsentRequest {
  id: string;
  status: AbdmConsentRequestStatus;
  purpose: (typeof ABDM_PURPOSES)[number];
  hi_types: string[];
  date_from: string;
  date_to: string;
  data_erase_at: string;
  hiu_id: string;
  facility_name: string;
  requester: string | null;
  error_code: string;
  error_message: string;
  created_date: string;
  artefacts: AbdmReceivedArtefact[];
}

export interface AbdmConsentRequestCreate {
  patient: string;
  facility: string;
  purpose: string;
  hi_types: string[];
  date_from: string;
  date_to: string;
  data_erase_at: string;
}

export interface AbdmReceivedRecords {
  consent_id: string;
  hip_name: string;
  data_erase_at: string | null;
  records: {
    care_context_reference: string;
    checksum: string;
    bundle: FhirBundle;
    created_date: string;
  }[];
}

export interface FhirCodeableConcept {
  text?: string;
  coding?: { system?: string; code?: string; display?: string }[];
}

export interface FhirReference {
  reference: string;
}

interface FhirQuantity {
  value?: number;
  unit?: string;
}

export interface FhirDosage {
  text?: string;
  patientInstruction?: string;
  route?: FhirCodeableConcept;
  doseAndRate?: { doseQuantity?: FhirQuantity }[];
  timing?: {
    code?: FhirCodeableConcept;
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: string;
      boundsDuration?: FhirQuantity;
    };
  };
}

// Only the fields the record view reads; bundles carry more
export interface FhirResource {
  resourceType: string;
  id: string;
  name?: string | { text?: string }[];
  title?: string;
  date?: string;
  status?: string;
  criticality?: string;
  code?: FhirCodeableConcept;
  medicationCodeableConcept?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept;
  dosageInstruction?: FhirDosage[];
  note?: { text: string }[];
  author?: FhirReference[];
  custodian?: FhirReference;
  encounter?: FhirReference;
  diagnosis?: { condition: FhirReference }[];
  section?: { title: string; entry?: FhirReference[] }[];
}

export interface FhirBundle {
  resourceType: "Bundle";
  type: string;
  timestamp?: string;
  entry: { fullUrl: string; resource: FhirResource }[];
}

export interface AbdmSharedRecord {
  care_context_reference: string;
  display: string;
  hi_type: string;
  checksum: string;
  bundle: FhirBundle;
}

export interface AbdmTransferDetail {
  transaction_id: string;
  session_status: string;
  created_date: string;
  requester: string | null;
  records: AbdmSharedRecord[];
}

export interface AbdmVisitPreview {
  records: { hi_type: string; bundle: FhirBundle }[];
}
