export interface AbhaConfig {
  enabled: boolean;
  demo_auth?: boolean;
  face_auth?: boolean;
  identifier_configs?: {
    abha_number: string | null;
    abha_address: string | null;
  };
}

export interface AbhaAccount {
  index: number | null;
  abha_number: string | null;
  abha_address: string | null;
  name: string | null;
  gender: string | null;
  status: string | null;
  kyc_verified: boolean;
  auth_methods: string[];
  photo: string | null;
}

export interface AbhaProfile {
  abha_number: string | null;
  abha_address: string | null;
  name: string | null;
  gender: "male" | "female" | "transgender" | null;
  date_of_birth: string | null;
  year_of_birth: number | null;
  phone_number: string | null;
  address: string | null;
  pincode: number | null;
  state_name: string | null;
  district_name: string | null;
  photo: string | null;
  kyc_verified: boolean;
}

export type AbhaLoginIdentifier = "aadhaar" | "abha_number" | "mobile_index";

export type AbhaOtpSystem = "aadhaar" | "abdm";

export interface AbhaJourneyResponse {
  journey_id: string;
  message?: string | null;
}

export interface AbhaSearchResponse {
  journey_id: string;
  accounts: AbhaAccount[];
}

export interface AbhaLoginVerifyResponse {
  journey_id: string;
  status: "verified" | "select_account";
  accounts: AbhaAccount[];
}

export interface AbhaProfileResponse {
  journey_id: string;
  profile: AbhaProfile;
}

export interface AbhaEnrolVerifyResponse {
  journey_id: string;
  is_new: boolean;
  mobile_verification_required: boolean;
  profile: AbhaProfile;
}

export interface AbhaMobileVerifyResponse {
  journey_id: string;
  verified: boolean;
  message?: string | null;
}

export interface AbhaAddressSuggestionsResponse {
  journey_id: string;
  suggestions: string[];
}

export interface AbhaAddressResponse {
  journey_id: string;
  abha_number: string | null;
  abha_address: string | null;
}

export interface AbhaApiError {
  type: string;
  code?: string | null;
  msg: string;
  request_id?: string;
  abha_number?: string;
}
