import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { AbdmRecordView } from "@/components/Abdm/AbdmRecordView";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import hipApi from "@/types/abdm/hipApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

interface Props {
  patientId: string;
  consentId: string | null;
  onClose: () => void;
}

/** Records another provider sent under one consent artefact. */
export function AbdmReceivedSheet({ patientId, consentId, onClose }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["abdm-received", patientId, consentId],
    queryFn: query(hipApi.getReceived, {
      pathParams: { patientId, consentId: consentId ?? "" },
    }),
    enabled: !!consentId,
  });

  return (
    <Sheet open={!!consentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {t("abdm_records_from", {
              provider: data?.hip_name || t("abdm_unknown_provider"),
            })}
          </SheetTitle>
          {data?.data_erase_at && (
            <SheetDescription>
              {t("abdm_records_erased_on", {
                date: formatDateTime(data.data_erase_at),
              })}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          {isLoading && <CardListSkeleton count={2} />}
          {data?.records.length === 0 && (
            <p className="text-sm text-gray-600">{t("abdm_no_records_held")}</p>
          )}
          {data?.records.map((record, index) => (
            <section
              key={`${record.care_context_reference}-${index}`}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-4"
            >
              <span className="text-xs text-gray-500">
                {t("abdm_received_on", {
                  date: formatDateTime(record.created_date),
                })}
              </span>
              <AbdmRecordView bundle={record.bundle} />
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
