import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  AbdmCareContext,
  AbdmConsentRequest,
  AbdmConsentRequestCreate,
  AbdmExchange,
  AbdmFacilitySettings,
  AbdmPatientOverview,
  AbdmReadiness,
  AbdmReceivedRecords,
  AbdmTransferDetail,
  AbdmVisitPreview,
} from "./hip";

export default {
  getFacility: {
    path: "/api/v1/abdm/facility/{facilityId}/",
    method: HttpMethod.GET,
    TRes: Type<AbdmFacilitySettings>(),
  },
  updateFacility: {
    path: "/api/v1/abdm/facility/{facilityId}/",
    method: HttpMethod.PUT,
    TBody: Type<{ hip_id: string }>(),
    TRes: Type<AbdmFacilitySettings>(),
  },
  readiness: {
    path: "/api/v1/abdm/facility/{facilityId}/readiness/",
    method: HttpMethod.GET,
    TRes: Type<AbdmReadiness>(),
  },
  getCareContext: {
    path: "/api/v1/abdm/care_context/{encounterId}/",
    method: HttpMethod.GET,
    TRes: Type<AbdmCareContext>(),
  },
  linkCareContext: {
    path: "/api/v1/abdm/care_context/{encounterId}/link/",
    method: HttpMethod.POST,
    TBody: Type<Record<string, never>>(),
    TRes: Type<AbdmCareContext>(),
  },
  listExchanges: {
    path: "/api/v1/abdm/exchange/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<AbdmExchange>>(),
  },
  getPatient: {
    path: "/api/v1/abdm/patient/{patientId}/",
    method: HttpMethod.GET,
    TRes: Type<AbdmPatientOverview>(),
  },
  getTransfer: {
    path: "/api/v1/abdm/patient/{patientId}/transfer/{transactionId}/",
    method: HttpMethod.GET,
    TRes: Type<AbdmTransferDetail>(),
  },
  previewCareContext: {
    path: "/api/v1/abdm/care_context/{encounterId}/preview/",
    method: HttpMethod.GET,
    TRes: Type<AbdmVisitPreview>(),
  },
  getReceived: {
    path: "/api/v1/abdm/patient/{patientId}/received/{consentId}/",
    method: HttpMethod.GET,
    TRes: Type<AbdmReceivedRecords>(),
  },
  createConsentRequest: {
    path: "/api/v1/abdm/consent_request/",
    method: HttpMethod.POST,
    TBody: Type<AbdmConsentRequestCreate>(),
    TRes: Type<AbdmConsentRequest>(),
  },
  refreshConsentRequest: {
    path: "/api/v1/abdm/consent_request/{id}/refresh/",
    method: HttpMethod.POST,
    TBody: Type<Record<string, never>>(),
    TRes: Type<AbdmConsentRequest>(),
  },
  fetchConsentRequest: {
    path: "/api/v1/abdm/consent_request/{id}/fetch/",
    method: HttpMethod.POST,
    TBody: Type<Record<string, never>>(),
    TRes: Type<AbdmConsentRequest>(),
  },
} as const;
