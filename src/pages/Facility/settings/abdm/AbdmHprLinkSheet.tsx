import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { AbdmProfessional } from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  member: { username: string; name: string };
  onLinked: (professional: AbdmProfessional) => void;
}

/**
 * Link a CARE user to their HPR ID. HPR sends an OTP to the mobile on the
 * professional's Aadhaar, so the professional has to be present.
 */
export function AbdmHprLinkSheet({
  open,
  onOpenChange,
  facilityId,
  member,
  onLinked,
}: Props) {
  const { t } = useTranslation();
  const [hprId, setHprId] = useState("");
  const [otp, setOtp] = useState("");

  const login = useMutation({
    mutationFn: mutate(registryApi.login, { pathParams: { facilityId } }),
  });
  const confirm = useMutation({
    mutationFn: mutate(registryApi.confirmLogin, { pathParams: { facilityId } }),
    onSuccess: (professional: AbdmProfessional) => {
      onLinked(professional);
      onOpenChange(false);
    },
  });

  const reset = (next: boolean) => {
    if (!next) {
      setHprId("");
      setOtp("");
      login.reset();
      confirm.reset();
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={reset}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("abdm_hpr_link_title", { name: member.name })}</SheetTitle>
          <SheetDescription>{t("abdm_hpr_link_description")}</SheetDescription>
        </SheetHeader>
        {!login.data ? (
          <form
            className="flex flex-col gap-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ username: member.username, hpr_id: hprId.trim() });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="abdm_hpr_id">{t("abdm_hpr_id")}</Label>
              <Input
                id="abdm_hpr_id"
                value={hprId}
                onChange={(e) => setHprId(e.target.value)}
                placeholder="name@hpr.abdm"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">{t("abdm_hpr_id_hint")}</p>
            </div>
            <Button type="submit" disabled={!hprId.trim() || login.isPending}>
              {login.isPending && <Loader2 className="animate-spin" />}
              {t("abdm_hpr_send_otp")}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              confirm.mutate({ journey_id: login.data.journey_id, otp });
            }}
          >
            <p className="text-sm text-gray-700">
              {login.data.mobile
                ? t("abdm_hpr_otp_sent_to", {
                    name: login.data.name,
                    mobile: login.data.mobile,
                  })
                : t("abdm_hpr_otp_sent", { name: login.data.name })}
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="abdm_hpr_otp">{t("abdm_otp")}</Label>
              <Input
                id="abdm_hpr_otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
              />
            </div>
            <Button type="submit" disabled={otp.length < 6 || confirm.isPending}>
              {confirm.isPending && <Loader2 className="animate-spin" />}
              {t("abdm_hpr_verify_and_link")}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
