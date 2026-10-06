import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AbdmConsentRequestsCard } from "@/components/Abdm/AbdmConsentRequestsCard";
import { AbdmTransferSheet } from "@/components/Abdm/AbdmTransferSheet";
import { AbdmVisitSheet } from "@/components/Abdm/AbdmVisitSheet";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import {
  AbdmConsent,
  AbdmPatientCareContext,
  AbdmPatientOverview,
  CareContextStatus,
} from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";

const IN_FLIGHT_POLL_MS = 5000;

const STATUS_VARIANT: Record<
  CareContextStatus,
  "secondary" | "green" | "destructive" | "yellow"
> = {
  pending: "secondary",
  awaiting_token: "yellow",
  linking: "yellow",
  linked: "green",
  failed: "destructive",
};

const CONSENT_VARIANT: Record<string, "green" | "secondary" | "destructive"> = {
  GRANTED: "green",
  REVOKED: "destructive",
  DENIED: "destructive",
  EXPIRED: "secondary",
};

function HiTypes({ careContext }: { careContext: AbdmPatientCareContext }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-1">
      {careContext.hi_types.map((type) => {
        const linked = careContext.linked_hi_types.includes(type);
        return (
          <Badge
            key={type}
            variant={linked ? "outline" : "yellow"}
            size="xs"
            title={linked ? undefined : t("abdm_record_type_not_announced")}
          >
            {type}
          </Badge>
        );
      })}
    </div>
  );
}

function CareContextsCard({
  patientId,
  careContexts,
  onView,
}: {
  patientId: string;
  careContexts: AbdmPatientCareContext[];
  onView: (careContext: AbdmPatientCareContext) => void;
}) {
  const { t } = useTranslation();
  const notFindable = careContexts.filter((c) => c.status !== "linked").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("abdm_linked_visits")}</CardTitle>
        <CardDescription>
          {t("abdm_linked_visits_summary", {
            total: careContexts.length,
            notFindable,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {careContexts.length === 0 ? (
          <p className="text-sm text-gray-600">{t("abdm_no_linked_visits")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("abdm_visit")}</TableHead>
                <TableHead>{t("abdm_record_types")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("abdm_last_update")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {careContexts.map((careContext) => (
                <TableRow key={careContext.reference_number}>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/facility/${careContext.facility}/patient/${patientId}/encounter/${careContext.encounter}/updates`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {careContext.display}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {careContext.facility_name} · {careContext.hip_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <HiTypes careContext={careContext} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Badge variant={STATUS_VARIANT[careContext.status]}>
                      {t(`abdm_care_context_status__${careContext.status}`)}
                    </Badge>
                    {careContext.error_code && (
                      <div className="mt-1 text-xs text-red-700">
                        {careContext.error_code}: {careContext.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(
                      careContext.notified_at ??
                        careContext.linked_at ??
                        careContext.modified_date,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(careContext)}
                    >
                      {t("abdm_view_shared")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ConsentItem({
  consent,
  careContexts,
  onViewTransfer,
}: {
  consent: AbdmConsent;
  careContexts: AbdmPatientCareContext[];
  onViewTransfer: (transactionId: string) => void;
}) {
  const { t } = useTranslation();
  const displayOf = (reference: string) =>
    careContexts.find((c) => c.reference_number === reference)?.display ??
    reference;

  return (
    <li className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-900">
          {consent.requester ?? t("abdm_unknown_requester")}
        </span>
        <Badge variant={CONSENT_VARIANT[consent.status] ?? "secondary"}>
          {consent.status}
        </Badge>
        {consent.purpose && (
          <span className="text-sm text-gray-600">{consent.purpose}</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1 text-sm text-gray-700 sm:grid-cols-2">
        <span>
          {t("abdm_record_types")}: {consent.hi_types.join(", ") || "-"}
        </span>
        <span>
          {t("abdm_consent_range", {
            from: consent.date_from ? formatDateTime(consent.date_from) : "-",
            to: consent.date_to ? formatDateTime(consent.date_to) : "-",
          })}
        </span>
        {consent.data_erase_at && (
          <span>
            {t("abdm_consent_expires", {
              date: formatDateTime(consent.data_erase_at),
            })}
          </span>
        )}
        <span>
          {t("abdm_consent_received", {
            date: formatDateTime(consent.created_date),
          })}
        </span>
      </div>
      {consent.care_context_references.length > 0 && (
        <div className="text-sm text-gray-700">
          {t("abdm_consent_visits")}:{" "}
          {consent.care_context_references.map(displayOf).join("; ")}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-gray-500">
          {t("abdm_transfers")}
        </span>
        {consent.transfers.length === 0 ? (
          <span className="text-sm text-gray-600">
            {t("abdm_no_transfers")}
          </span>
        ) : (
          consent.transfers.map((transfer) => (
            <div key={transfer.transaction_id} className="text-sm">
              <span className="text-gray-900">
                {formatDateTime(transfer.created_date)}
              </span>{" "}
              <Badge
                variant={
                  transfer.session_status === "TRANSFERRED"
                    ? "green"
                    : ["FAILED", "ERRORED"].includes(transfer.session_status)
                      ? "destructive"
                      : "secondary"
                }
                size="xs"
              >
                {transfer.session_status}
              </Badge>
              {transfer.record_count > 0 && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => onViewTransfer(transfer.transaction_id)}
                >
                  {t("abdm_view_records_sent")}
                </Button>
              )}
              {transfer.error_message && (
                <span className="ml-2 text-red-700">
                  {transfer.error_message}
                </span>
              )}
              {transfer.status_responses.length > 0 && (
                <ul className="ml-4 list-disc text-xs text-gray-600">
                  {transfer.status_responses.map((status) => (
                    <li key={status.careContextReference}>
                      {displayOf(status.careContextReference)}:{" "}
                      {status.hiStatus}
                      {status.description && ` (${status.description})`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </li>
  );
}

export function AbdmTab({ patientId, facilityId }: PatientProps) {
  const { t } = useTranslation();
  const [visit, setVisit] = useState<AbdmPatientCareContext | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery<AbdmPatientOverview>({
    queryKey: ["abdm-patient", patientId],
    queryFn: query(hipApi.getPatient, {
      pathParams: { patientId },
      silent: true,
    }),
    retry: false,
    // ABDM answers on callbacks, so poll while anything is waiting on one
    refetchInterval: ({ state }) =>
      state.data?.consent_requests.some(
        (request) =>
          ["SENDING", "REQUESTED"].includes(request.status) ||
          request.artefacts.some(
            (artefact) =>
              artefact.status === "GRANTED" &&
              !["RECEIVED", "FAILED"].includes(artefact.session_status),
          ),
      )
        ? IN_FLIGHT_POLL_MS
        : false,
  });

  if (isLoading) {
    return <CardListSkeleton count={3} />;
  }

  if (!data) {
    return (
      <EmptyState
        title={
          error instanceof HTTPError && error.status === 404
            ? t("abdm_not_enabled")
            : t("something_went_wrong")
        }
      />
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("abha")}</CardTitle>
          <CardDescription>
            {data.abha_address
              ? [data.abha_number, data.abha_address].filter(Boolean).join(" · ")
              : t("abdm_patient_has_no_abha")}
          </CardDescription>
        </CardHeader>
      </Card>

      <CareContextsCard
        patientId={patientId}
        careContexts={data.care_contexts}
        onView={setVisit}
      />

      <AbdmConsentRequestsCard
        patientId={patientId}
        facilityId={facilityId}
        abhaAddress={data.abha_address}
        consentRequests={data.consent_requests}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("abdm_consents")}</CardTitle>
          <CardDescription>{t("abdm_consents_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.consents.length === 0 ? (
            <p className="text-sm text-gray-600">{t("abdm_no_consents")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.consents.map((consent) => (
                <ConsentItem
                  key={consent.consent_id}
                  consent={consent}
                  careContexts={data.care_contexts}
                  onViewTransfer={setTransactionId}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AbdmVisitSheet
        careContext={visit}
        consents={data.consents}
        onClose={() => setVisit(null)}
        onViewTransfer={(id) => {
          setVisit(null);
          setTransactionId(id);
        }}
      />
      <AbdmTransferSheet
        patientId={patientId}
        transactionId={transactionId}
        onClose={() => setTransactionId(null)}
      />
    </div>
  );
}
