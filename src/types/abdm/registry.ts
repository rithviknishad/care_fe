export interface AbdmOption {
  code: string;
  name: string;
}

export interface AbdmState extends AbdmOption {
  districts: AbdmOption[];
}

export interface AbdmHprCategory extends AbdmOption {
  sub_categories: AbdmOption[];
}

export interface AbdmHfrFacility {
  facility_id: string;
  name: string;
  status: string | null;
  ownership: string | null;
  ownership_code: string | null;
  facility_type: string | null;
  system_of_medicine: string | null;
  state: string | null;
  district: string | null;
  sub_district: string | null;
  address: string | null;
  pincode: string | null;
}

export interface AbdmHfrSearch {
  facility_id?: string;
  name?: string;
  state_code?: string;
  district_code?: string;
  ownership_code?: string;
  page?: number;
}

export interface AbdmHfrSearchResults {
  results: AbdmHfrFacility[];
  total: number;
  pages: number;
}

export interface AbdmProfessional {
  hpr_id: string;
  hpr_id_number: string;
  name: string;
  verified_at: string;
}

export interface AbdmHfrApplication {
  tracking_id: string;
  hfr_id: string;
  submitted_at: string | null;
  information: Partial<AbdmHfrOnboard>;
  error_code: string;
  error_message: string;
  modified_date: string;
}

export interface AbdmRegistryOverview {
  hip_id: string | null;
  hfr: AbdmHfrFacility | null;
  hfr_error: string | null;
  application: AbdmHfrApplication | null;
  me: {
    username: string;
    professional: AbdmProfessional | null;
    hpr_signed_in: boolean;
  };
}

export interface AbdmFacilityMember {
  username: string;
  name: string;
  professional: AbdmProfessional | null;
}

export interface AbdmHfrOnboard {
  name: string;
  state_code: string;
  district_code: string;
  sub_district_code: string;
  region: string;
  address_line1: string;
  address_line2: string;
  pincode: string;
  latitude: string;
  longitude: string;
  email: string;
  phone: string;
  website: string;
  ownership_code: string;
  ownership_sub_type_code: string;
  ownership_sub_type_code2: string;
  system_of_medicine_codes: string[];
  type_of_service_codes: string[];
  facility_type_code: string;
  facility_sub_type_code: string;
  speciality_type_code: string;
  operational_status: string;
  timings: { working_days: string; opening_hours: string }[];
}

export interface AbdmHprCreateStatus {
  authenticated: boolean;
  linked?: AbdmProfessional | null;
  mobile_verified?: boolean;
  suggestions?: string[];
  prefill?: {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    state_code: string;
    district_code: string;
  };
}

export interface AbdmHprCreate {
  journey_id: string;
  hpr_id: string;
  email: string;
  password: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  category: string;
  sub_category: string;
  state_code: string;
  district_code: string;
}

export type AbdmMasterKind =
  | "states"
  | "sub_districts"
  | "master"
  | "facility_types"
  | "facility_sub_types"
  | "ownership_sub_types"
  | "owner_sub_types"
  | "hpr_categories";
