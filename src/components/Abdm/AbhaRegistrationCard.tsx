import { useQuery } from "@tanstack/react-query";
import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AbhaFlow } from "@/components/Abdm/AbhaFlow";

import { AbhaConfig, AbhaProfile } from "@/types/abdm/abha";
import abhaApi from "@/types/abdm/abhaApi";
import query from "@/Utils/request/query";

interface AbhaRegistrationCardProps {
  phoneNumber?: string;
  onApply: (profile: AbhaProfile, config: AbhaConfig) => string[];
}

/**
 * Optional ABHA step ahead of the registration form. It fills the form from
 * the ABHA profile; registration still completes when the desk skips it.
 */
export function AbhaRegistrationCard({
  phoneNumber,
  onApply,
}: AbhaRegistrationCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<{
    profile: AbhaProfile;
    fields: string[];
  }>();

  const { data: config } = useQuery({
    queryKey: ["abha-config"],
    queryFn: query(abhaApi.config, { silent: true }),
    staleTime: Infinity,
  });

  if (!config?.enabled) {
    return null;
  }

  const handleComplete = (profile: AbhaProfile) => {
    setApplied({ profile, fields: onApply(profile, config) });
    setOpen(false);
  };

  const identifiersConfigured =
    !!config.identifier_configs?.abha_number &&
    !!config.identifier_configs?.abha_address;

  return (
    <div className="bg-white flex flex-col gap-3 p-6 shadow rounded-md">
      {applied ? (
        <div className="flex gap-4">
          {applied.profile.photo && (
            <img
              src={`data:image/jpeg;base64,${applied.profile.photo}`}
              alt={t("abha_profile_photo")}
              className="size-16 rounded-md object-cover"
            />
          )}
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-900">
              {applied.profile.name}
            </span>
            <span className="text-gray-700">
              {[applied.profile.abha_number, applied.profile.abha_address]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="text-gray-600">
              {t("abha_filled_fields", {
                fields: applied.fields.map((f) => t(f)).join(", "),
              })}
            </span>
            <span className="text-gray-500">{t("abha_corrections_note")}</span>
            {!identifiersConfigured && (
              <span className="text-yellow-700">
                {t("abha_identifiers_not_configured")}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h5 className="text-lg font-semibold">{t("abha_find_or_create")}</h5>
            <span className="text-sm text-gray-600">
              {t("abha_find_or_create_description")}
            </span>
          </div>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <Fingerprint />
            {t("abha_start")}
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("abha_find_or_create")}</DialogTitle>
            <DialogDescription>{t("abha_not_now_hint")}</DialogDescription>
          </DialogHeader>
          {open && (
            <AbhaFlow initialMobile={phoneNumber} onComplete={handleComplete} />
          )}
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("not_now")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
