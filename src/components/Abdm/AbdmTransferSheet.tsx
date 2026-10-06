import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
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
  transactionId: string | null;
  onClose: () => void;
}

/** Exactly what one consent-backed transfer sent to the requester. */
export function AbdmTransferSheet({ patientId, transactionId, onClose }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["abdm-transfer", patientId, transactionId],
    queryFn: query(hipApi.getTransfer, {
      pathParams: { patientId, transactionId: transactionId ?? "" },
    }),
    enabled: !!transactionId,
  });

  return (
    <Sheet open={!!transactionId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("abdm_records_sent")}</SheetTitle>
          {data && (
            <SheetDescription>
              {t("abdm_records_sent_to", {
                requester: data.requester ?? t("abdm_unknown_requester"),
                date: formatDateTime(data.created_date),
              })}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          {isLoading && <CardListSkeleton count={2} />}
          {data?.records.length === 0 && (
            <p className="text-sm text-gray-600">
              {t("abdm_transfer_contents_not_kept")}
            </p>
          )}
          {data?.records.map((record) => (
            <section
              key={`${record.care_context_reference}-${record.hi_type}`}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">
                  {record.display}
                </span>
                <Badge variant="outline">{record.hi_type}</Badge>
              </div>
              <span
                className="text-xs text-gray-500"
                title={t("abdm_checksum_hint")}
              >
                {t("abdm_checksum", { checksum: record.checksum })}
              </span>
              <AbdmRecordView bundle={record.bundle} />
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
