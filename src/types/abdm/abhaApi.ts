import { HttpMethod, Type } from "@/Utils/request/types";

import {
  AbhaAddressResponse,
  AbhaAddressSuggestionsResponse,
  AbhaConfig,
  AbhaEnrolVerifyResponse,
  AbhaJourneyResponse,
  AbhaLoginIdentifier,
  AbhaLoginVerifyResponse,
  AbhaMobileVerifyResponse,
  AbhaOtpSystem,
  AbhaProfileResponse,
  AbhaSearchResponse,
} from "./abha";

const base = "/api/v1/abdm/abha";

export default {
  config: {
    path: `${base}/config/`,
    method: HttpMethod.GET,
    TRes: Type<AbhaConfig>(),
  },
  search: {
    path: `${base}/search/`,
    method: HttpMethod.POST,
    TBody: Type<{ mobile: string }>(),
    TRes: Type<AbhaSearchResponse>(),
  },
  loginRequestOtp: {
    path: `${base}/login_request_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{
      journey_id?: string;
      identifier_type: AbhaLoginIdentifier;
      value: string;
      otp_system?: AbhaOtpSystem;
    }>(),
    TRes: Type<AbhaJourneyResponse>(),
  },
  loginVerifyOtp: {
    path: `${base}/login_verify_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; otp: string }>(),
    TRes: Type<AbhaLoginVerifyResponse>(),
  },
  loginSelectAccount: {
    path: `${base}/login_select_account/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; abha_number: string }>(),
    TRes: Type<AbhaJourneyResponse>(),
  },
  profile: {
    path: `${base}/profile/`,
    method: HttpMethod.GET,
    TRes: Type<AbhaProfileResponse>(),
  },
  enrolRequestOtp: {
    path: `${base}/enrol_request_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id?: string; aadhaar: string }>(),
    TRes: Type<AbhaJourneyResponse>(),
  },
  enrolVerifyOtp: {
    path: `${base}/enrol_verify_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; otp: string; mobile: string }>(),
    TRes: Type<AbhaEnrolVerifyResponse>(),
  },
  enrolMobileRequestOtp: {
    path: `${base}/enrol_mobile_request_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; mobile: string }>(),
    TRes: Type<AbhaJourneyResponse>(),
  },
  enrolMobileVerifyOtp: {
    path: `${base}/enrol_mobile_verify_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; otp: string }>(),
    TRes: Type<AbhaMobileVerifyResponse>(),
  },
  enrolAddressSuggestions: {
    path: `${base}/enrol_address_suggestions/`,
    method: HttpMethod.GET,
    TRes: Type<AbhaAddressSuggestionsResponse>(),
  },
  enrolAddress: {
    path: `${base}/enrol_address/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; abha_address: string }>(),
    TRes: Type<AbhaAddressResponse>(),
  },
  card: {
    path: `${base}/card/`,
    method: HttpMethod.GET,
    TRes: Type<Blob>(),
  },
  qrCode: {
    path: `${base}/qr_code/`,
    method: HttpMethod.GET,
    TRes: Type<Blob>(),
  },
} as const;
