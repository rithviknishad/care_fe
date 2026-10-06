import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AbdmConsentRequestSheet } from "@/components/Abdm/AbdmConsentRequestSheet";
import { AbdmReceivedSheet } from "@/components/Abdm/AbdmReceivedSheet";

import {
  AbdmConsentRequest,
  AbdmConsentRequestStatus,
  AbdmReceivedArtefact,
} from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import mutate from "@/Utils/request/mutate";
import { formatDateTime } from "@/Utils/utils";

const STATUS_VARIANT: Record<
  AbdmConsentRequestStatus,
  "secondary" | "green" | "destructive" | "yellow"
> = {
  SENDING: "secondary",
  REQUESTED: "yellow",
  GRANTED: "green",
  FAILED: "destructive",
  DENIED: "destructive",
  EXPIRED: "secondary",
  REVOKED: "destructive",
};

function ArtefactItem({
  artefact,
  onView,
}: {
  artefact: AbdmReceivedArtefact;
  onView: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex flex-col gap-1 rounded-md border border-gray-200 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">
            {artefact.hip_name || artefact.hip_id || t("abdm_unknown_provider")}
          </span>
          <Badge variant={STATUS_VARIANT[artefact.status] ?? "secondary"} size="xs">
            {artefact.status}
          </Badge>
          {artefact.session_status && (
            <Badge
              variant={
                artefact.session_status === "RECEIVED"
                  ? "green"
                  : artefact.session_status === "FAILED"
                    ? "destructive"
                    : "secondary"
              }
              size="xs"
            >
              {artefact.session_status}
            </Badge>
          )}
        </div>
        {artefact.record_count > 0 && (
          <Button variant="outline" size="sm" onClick={onView}>
            {t("abdm_view_received", { count: artefact.record_count })}
          </Button>
        )}
      </div>
      {artefact.hi_types.length > 0 && (
        <span className="text-xs text-gray-600">
          {artefact.hi_types.join(", ")} ·{" "}
          {t("abdm_visit_count", { count: artefact.care_context_count })}
        </span>
      )}
      {artefact.data_erase_at && (
        <span className="text-xs text-gray-500">
          {t("abdm_records_erased_on", {
            date: formatDateTime(artefact.data_erase_at),
          })}
        </span>
      )}
      {artefact.status_responses
        .filter((status) => status.hiStatus !== "OK")
        .map((status) => (
          <span key={status.careContextReference} className="text-xs text-red-700">
            {status.careContextReference}: {status.description}
          </span>
        ))}
      {artefact.error_message && (
        <span className="text-xs text-red-700">
          {[artefact.error_code, artefact.error_message]
            .filter(Boolean)
            .join(": ")}
        </span>
      )}
    </li>
  );
}

function ConsentRequestItem({
  consentRequest,
  onViewRecords,
}: {
  consentRequest: AbdmConsentRequest;
  onViewRecords: (consentId: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pathParams = { id: consentRequest.id };
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["abdm-patient"] });
  const refresh = useMutation({
    mutationFn: mutate(hipApi.refreshConsentRequest, { pathParams }),
    onSuccess,
  });
  const fetchAgain = useMutation({
    mutationFn: mutate(hipApi.fetchConsentRequest, { pathParams }),
    onSuccess,
  });

  return (
    <li className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">
            {t(`abdm_purpose__${consentRequest.purpose}`)}
          </span>
          <Badge variant={STATUS_VARIANT[consentRequest.status]}>
            {consentRequest.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {consentRequest.status === "REQUESTED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate({})}
            >
              {t("abdm_check_status")}
            </Button>
          )}
          {consentRequest.status === "GRANTED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={fetchAgain.isPending}
              onClick={() => fetchAgain.mutate({})}
            >
              {t("abdm_fetch_again")}
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 text-sm text-gray-700 sm:grid-cols-2">
        <span>
          {t("abdm_record_types")}: {consentRequest.hi_types.join(", ")}
        </span>
        <span>
          {t("abdm_consent_range", {
            from: formatDateTime(consentRequest.date_from),
            to: formatDateTime(consentRequest.date_to),
          })}
        </span>
        <span>
          {t("abdm_requested_by", {
            requester: consentRequest.requester ?? "-",
            facility: consentRequest.facility_name,
            date: formatDateTime(consentRequest.created_date),
          })}
        </span>
        <span>
          {t("abdm_access_until_date", {
            date: formatDateTime(consentRequest.data_erase_at),
          })}
        </span>
      </div>
      {consentRequest.error_message && (
        <p className="text-sm text-red-700">
          {[consentRequest.error_code, consentRequest.error_message]
            .filter(Boolean)
            .join(": ")}
        </p>
      )}
      {consentRequest.artefacts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {consentRequest.artefacts.map((artefact) => (
            <ArtefactItem
              key={artefact.consent_id}
              artefact={artefact}
              onView={() => onViewRecords(artefact.consent_id)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface Props {
  patientId: string;
  facilityId?: string;
  abhaAddress: string | null;
  consentRequests: AbdmConsentRequest[];
}

/** Records this facility has asked for from other providers, and what arrived. */
export function AbdmConsentRequestsCard({
  patientId,
  facilityId,
  abhaAddress,
  consentRequests,
}: Props) {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <CardTitle>{t("abdm_records_from_others")}</CardTitle>
          <CardDescription>
            {abhaAddress
              ? t("abdm_records_from_others_description")
              : t("abdm_request_needs_abha")}
          </CardDescription>
        </div>
        {facilityId && abhaAddress && (
          <Button onClick={() => setRequesting(true)}>
            {t("abdm_request_records")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {consentRequests.length === 0 ? (
          <p className="text-sm text-gray-600">{t("abdm_no_requests")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consentRequests.map((consentRequest) => (
              <ConsentRequestItem
                key={consentRequest.id}
                consentRequest={consentRequest}
                onViewRecords={setConsentId}
              />
            ))}
          </ul>
        )}
      </CardContent>
      {facilityId && abhaAddress && (
        <AbdmConsentRequestSheet
          open={requesting}
          onOpenChange={setRequesting}
          patientId={patientId}
          facilityId={facilityId}
          abhaAddress={abhaAddress}
        />
      )}
      <AbdmReceivedSheet
        patientId={patientId}
        consentId={consentId}
        onClose={() => setConsentId(null)}
      />
    </Card>
  );
}
