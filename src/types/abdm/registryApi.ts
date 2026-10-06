import { HttpMethod, Type } from "@/Utils/request/types";

import {
  AbdmFacilityMember,
  AbdmHfrApplication,
  AbdmHfrOnboard,
  AbdmHfrSearch,
  AbdmHfrSearchResults,
  AbdmHprCreate,
  AbdmHprCreateStatus,
  AbdmProfessional,
  AbdmRegistryOverview,
} from "./registry";

const base = "/api/v1/abdm/registry/{facilityId}";

export default {
  get: {
    path: `${base}/`,
    method: HttpMethod.GET,
    TRes: Type<AbdmRegistryOverview>(),
  },
  search: {
    path: `${base}/search/`,
    method: HttpMethod.POST,
    TBody: Type<AbdmHfrSearch>(),
    TRes: Type<AbdmHfrSearchResults>(),
  },
  masters: {
    path: `${base}/masters/`,
    method: HttpMethod.GET,
    // The shape depends on `kind`; callers narrow it
    TRes: Type<{ results: unknown[] }>(),
  },
  registerServices: {
    path: `${base}/register_services/`,
    method: HttpMethod.POST,
    TBody: Type<Record<string, never>>(),
    TRes: Type<{ hip_id: string; message: string }>(),
  },
  onboard: {
    path: `${base}/onboard/`,
    method: HttpMethod.POST,
    TBody: Type<AbdmHfrOnboard>(),
    TRes: Type<AbdmHfrApplication>(),
  },
  professionals: {
    path: `${base}/professionals/`,
    method: HttpMethod.GET,
    TRes: Type<{ results: AbdmFacilityMember[] }>(),
  },
  login: {
    path: `${base}/login/`,
    method: HttpMethod.POST,
    TBody: Type<{ username: string; hpr_id: string }>(),
    TRes: Type<{ journey_id: string; mobile: string | null; name: string }>(),
  },
  confirmLogin: {
    path: `${base}/confirm_login/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; otp: string }>(),
    TRes: Type<AbdmProfessional>(),
  },
  unlink: {
    path: `${base}/unlink/`,
    method: HttpMethod.POST,
    TBody: Type<{ username: string }>(),
    TRes: Type<{ username: string; professional: null }>(),
  },
  createStart: {
    path: `${base}/create_start/`,
    method: HttpMethod.POST,
    TBody: Type<{ username: string }>(),
    TRes: Type<{ journey_id: string; url: string }>(),
  },
  createStatus: {
    path: `${base}/create_status/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string }>(),
    TRes: Type<AbdmHprCreateStatus>(),
  },
  createMobile: {
    path: `${base}/create_mobile/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; mobile: string }>(),
    TRes: Type<{ mobile_verified: boolean; otp_sent: boolean }>(),
  },
  createMobileOtp: {
    path: `${base}/create_mobile_otp/`,
    method: HttpMethod.POST,
    TBody: Type<{ journey_id: string; otp: string }>(),
    TRes: Type<{ mobile_verified: boolean }>(),
  },
  createHprId: {
    path: `${base}/create_hpr_id/`,
    method: HttpMethod.POST,
    TBody: Type<AbdmHprCreate>(),
    TRes: Type<AbdmProfessional>(),
  },
} as const;
