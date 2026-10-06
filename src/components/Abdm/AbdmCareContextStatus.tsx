import { useMutation, useQuery } from "@tanstack/react-query";
import { differenceInSeconds } from "date-fns";
import { Link2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { AbdmCareContext } from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const DUPLICATE_LINK_TOKEN_REQUEST = "ABDM-1092";

interface AbdmCareContextStatusProps {
  encounterId: string;
}

function stepMessage(
  careContext: AbdmCareContext,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const waitedTooLong =
    !!careContext.modified_date &&
    differenceInSeconds(new Date(), new Date(careContext.modified_date)) >
      (careContext.stale_after_seconds ?? 600);
  switch (careContext.status) {
    case "pending":
      return t("abdm_link_pending");
    case "awaiting_token":
      return waitedTooLong
        ? t("abdm_link_token_no_answer")
        : t("abdm_link_token_waiting");
    case "linking":
      return waitedTooLong
        ? t("abdm_linking_no_answer")
        : t("abdm_linking_waiting");
    case "linked":
      return t("abdm_linked", {
        address: careContext.abha_address,
        types: (careContext.linked_hi_types ?? []).join(", "),
      });
    case "failed":
      return t("abdm_link_refused", {
        code: careContext.error_code,
        message: careContext.error_message,
      });
    default:
      return null;
  }
}

/** Where this visit's ABDM link has got to, read from the record rather than the page. */
export function AbdmCareContextStatus({
  encounterId,
}: AbdmCareContextStatusProps) {
  const { t } = useTranslation();
  const queryKey = ["abdm-care-context", encounterId];
  const { data: careContext, refetch } = useQuery<AbdmCareContext>({
    queryKey,
    queryFn: query(hipApi.getCareContext, {
      pathParams: { encounterId },
      silent: true,
    }),
    retry: false,
    refetchInterval: (q) =>
      ["awaiting_token", "linking"].includes(q.state.data?.status ?? "")
        ? 10_000
        : false,
  });

  const { mutate: link, isPending } = useMutation({
    mutationFn: mutate(hipApi.linkCareContext, { pathParams: { encounterId } }),
    onSuccess: () => refetch(),
  });

  if (!careContext?.status) {
    return null;
  }

  const pendingUpdate =
    careContext.status === "linked" &&
    (careContext.hi_types ?? []).some(
      (type) => !(careContext.linked_hi_types ?? []).includes(type),
    );
  const canRetry =
    careContext.status === "failed" &&
    careContext.error_code !== DUPLICATE_LINK_TOKEN_REQUEST;

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-3 text-sm"
      role="status"
    >
      <Link2 className="size-4 text-gray-500" aria-hidden />
      <span className="font-medium text-gray-900">{t("abdm_abha_link")}</span>
      <Badge
        variant={
          careContext.status === "failed"
            ? "destructive"
            : careContext.status === "linked"
              ? "green"
              : "secondary"
        }
      >
        {t(`abdm_care_context_status__${careContext.status}`)}
      </Badge>
      <span className="text-gray-700">{stepMessage(careContext, t)}</span>
      {pendingUpdate && (
        <span className="text-gray-500">{t("abdm_link_update_pending")}</span>
      )}
      {careContext.error_code === DUPLICATE_LINK_TOKEN_REQUEST && (
        <span className="text-gray-500">{t("abdm_link_duplicate_hint")}</span>
      )}
      {canRetry && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={isPending}
          onClick={() => link({})}
        >
          {isPending && <Loader2 className="animate-spin" />}
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
