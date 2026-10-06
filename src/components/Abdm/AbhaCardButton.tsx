import { useQuery } from "@tanstack/react-query";
import { CircleAlert, IdCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AbhaFlow } from "@/components/Abdm/AbhaFlow";

import { AbhaApiError } from "@/types/abdm/abha";
import abhaApi from "@/types/abdm/abhaApi";
import { getPatientIdentifiers, PatientRead } from "@/types/emr/patient/patient";
import query, { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

interface AbhaCardButtonProps {
  patient: PatientRead;
}

export function AbhaCardButton({ patient }: AbhaCardButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["abha-config"],
    queryFn: query(abhaApi.config, { silent: true }),
    staleTime: Infinity,
  });

  const abhaNumber = getPatientIdentifiers(patient).find(
    (i) => i.config.id === config?.identifier_configs?.abha_number,
  )?.value;

  if (!config?.enabled || !abhaNumber) {
    return null;
  }

  return (
    <div className="sm:col-span-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <IdCard />
        {t("abha_view_card")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("abha_card")}</DialogTitle>
          </DialogHeader>
          {open && (
            <AbhaCardContent patientId={patient.id} abhaNumber={abhaNumber} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AbhaCardContent({
  patientId,
  abhaNumber,
}: {
  patientId: string;
  abhaNumber: string;
}) {
  const { t } = useTranslation();

  const card = useQuery({
    queryKey: ["abha-card", patientId],
    queryFn: ({ signal }) =>
      callApi(abhaApi.card, {
        queryParams: { patient: patientId },
        silent: true,
        signal,
      }),
    retry: false,
    gcTime: 0,
  });

  const [imageUrl, setImageUrl] = useState<string>();
  useEffect(() => {
    if (!(card.data instanceof Blob)) return;
    const url = URL.createObjectURL(card.data);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [card.data]);

  const error =
    card.error instanceof HTTPError
      ? (card.error.cause as { errors?: AbhaApiError[] })?.errors?.[0]
      : undefined;

  if (error?.type === "abha_reauth_required") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-700">{t("abha_reverify_for_card")}</p>
        <AbhaFlow
          initialAbhaNumber={abhaNumber}
          onComplete={() => card.refetch()}
        />
      </div>
    );
  }

  if (card.isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (card.isError) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{error?.msg || t("something_went_wrong")}</AlertTitle>
      </Alert>
    );
  }

  return imageUrl ? (
    <div className="flex flex-col gap-3">
      <img src={imageUrl} alt={t("abha_card")} className="w-full rounded-md" />
      <div className="flex justify-end">
        <Button asChild size="sm">
          <a href={imageUrl} download={`abha-card-${abhaNumber}.png`}>
            {t("download")}
          </a>
        </Button>
      </div>
    </div>
  ) : null;
}
