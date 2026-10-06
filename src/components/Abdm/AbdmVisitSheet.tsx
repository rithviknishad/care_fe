import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { AbdmRecordView } from "@/components/Abdm/AbdmRecordView";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { AbdmConsent, AbdmPatientCareContext } from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

interface Props {
  careContext: AbdmPatientCareContext | null;
  consents: AbdmConsent[];
  onClose: () => void;
  onViewTransfer: (transactionId: string) => void;
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm break-all text-gray-900">{value || "-"}</dd>
    </div>
  );
}

/** What ABDM holds about one visit, what has been sent from it, and what would be. */
export function AbdmVisitSheet({
  careContext,
  consents,
  onClose,
  onViewTransfer,
}: Props) {
  const { t } = useTranslation();
  const { data: preview, isLoading } = useQuery({
    queryKey: ["abdm-visit-preview", careContext?.encounter],
    queryFn: query(hipApi.previewCareContext, {
      pathParams: { encounterId: careContext?.encounter ?? "" },
    }),
    enabled: !!careContext,
  });

  const reference = careContext?.reference_number ?? "";
  const transfers = consents
    .filter((consent) => consent.care_context_references.includes(reference))
    .flatMap((consent) =>
      consent.transfers.map((transfer) => ({
        ...transfer,
        requester: consent.requester,
        status: transfer.status_responses.find(
          (status) => status.careContextReference === reference,
        ),
      })),
    );

  return (
    <Sheet open={!!careContext} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {careContext && (
          <>
            <SheetHeader>
              <SheetTitle>{careContext.display}</SheetTitle>
              <SheetDescription>{t("abdm_visit_sheet_description")}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 p-4">
              <section className="flex flex-col gap-2">
                <h3 className="font-medium text-gray-900">
                  {t("abdm_known_to_abdm")}
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Fact
                    label={t("abdm_abha_address")}
                    value={careContext.abha_address}
                  />
                  <Fact label={t("abdm_hip_id")} value={careContext.hip_id} />
                  <Fact
                    label={t("abdm_care_context_reference")}
                    value={careContext.reference_number}
                  />
                  <Fact
                    label={t("abdm_record_types_announced")}
                    value={careContext.linked_hi_types.join(", ")}
                  />
                  <Fact
                    label={t("abdm_linked_on")}
                    value={
                      careContext.linked_at && formatDateTime(careContext.linked_at)
                    }
                  />
                  <Fact
                    label={t("abdm_last_announced")}
                    value={
                      careContext.notified_at &&
                      formatDateTime(careContext.notified_at)
                    }
                  />
                </dl>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="font-medium text-gray-900">
                  {t("abdm_sent_from_visit")}
                </h3>
                {transfers.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    {t("abdm_nothing_sent_from_visit")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {transfers.map((transfer) => (
                      <li
                        key={transfer.transaction_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 p-3 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {transfer.requester ?? t("abdm_unknown_requester")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(transfer.created_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {transfer.status && (
                            <Badge
                              variant={
                                transfer.status.hiStatus === "DELIVERED"
                                  ? "green"
                                  : "destructive"
                              }
                              title={transfer.status.description}
                            >
                              {transfer.status.hiStatus}
                            </Badge>
                          )}
                          {transfer.record_count > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onViewTransfer(transfer.transaction_id)
                              }
                            >
                              {t("abdm_view_records_sent")}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="font-medium text-gray-900">
                  {t("abdm_would_send_now")}
                </h3>
                <p className="text-xs text-gray-500">
                  {t("abdm_would_send_now_description")}
                </p>
                {isLoading && <CardListSkeleton count={1} />}
                {preview?.records.length === 0 && (
                  <p className="text-sm text-gray-600">
                    {t("abdm_nothing_to_send")}
                  </p>
                )}
                {preview?.records.map((record) => (
                  <div
                    key={record.hi_type}
                    className="flex flex-col gap-2 rounded-md border border-gray-200 p-4"
                  >
                    <Badge variant="outline" className="self-start">
                      {record.hi_type}
                    </Badge>
                    <AbdmRecordView bundle={record.bundle} />
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
