import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import hipApi from "@/types/abdm/hipApi";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { AbdmHfrOnboardSheet } from "./AbdmHfrOnboardSheet";
import { AbdmHfrSearchSheet } from "./AbdmHfrSearchSheet";
import { AbdmHprLinkSheet } from "./AbdmHprLinkSheet";
import { AbdmProfessionalsCard } from "./AbdmProfessionalsCard";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 text-green-600" aria-hidden />
      ) : (
        <CircleAlert className="mt-0.5 size-4 text-red-600" aria-hidden />
      )}
      <span className={ok ? "text-gray-700" : "text-gray-900"}>{label}</span>
    </li>
  );
}

export default function AbdmSettings({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hipId, setHipId] = useState("");
  const [sheet, setSheet] = useState<"search" | "onboard" | "sign_in" | null>(
    null,
  );

  const { data: settings } = useQuery({
    queryKey: ["abdm-facility", facilityId],
    queryFn: query(hipApi.getFacility, { pathParams: { facilityId } }),
  });

  const { data: registry } = useQuery({
    queryKey: ["abdm-registry", facilityId],
    queryFn: query(registryApi.get, { pathParams: { facilityId } }),
  });

  useEffect(() => {
    setHipId(settings?.hip_id ?? "");
  }, [settings?.hip_id]);

  const readiness = useQuery({
    queryKey: ["abdm-readiness", facilityId],
    queryFn: query(hipApi.readiness, { pathParams: { facilityId } }),
    enabled: !!settings?.hip_id,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: mutate(hipApi.updateFacility, { pathParams: { facilityId } }),
    onSuccess: () => {
      toast.success(t("abdm_hip_id_saved"));
      setSheet(null);
      queryClient.invalidateQueries({ queryKey: ["abdm-facility", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["abdm-readiness", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["abdm-registry", facilityId] });
    },
  });

  const registerServices = useMutation({
    mutationFn: mutate(registryApi.registerServices, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("abdm_services_registered"));
      queryClient.invalidateQueries({ queryKey: ["abdm-readiness", facilityId] });
    },
  });

  const hfr = registry?.hfr;
  const me = registry?.me;
  const servedHere =
    !!readiness.data?.hip_registered && !!readiness.data?.hiu_registered;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("abdm_hip_settings")}</CardTitle>
          <CardDescription>{t("abdm_hip_settings_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save({ hip_id: hipId.trim() });
            }}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="abdm_hip_id">{t("abdm_hip_id")}</Label>
              <Input
                id="abdm_hip_id"
                value={hipId}
                onChange={(e) => setHipId(e.target.value)}
                placeholder="IN0000000000"
              />
            </div>
            <Button type="submit" disabled={isPending || !hipId.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("save")}
            </Button>
          </form>

          {registry?.hfr_error && (
            <p className="mt-3 text-sm text-red-700">{registry.hfr_error}</p>
          )}
          {hfr && (
            <div className="mt-3 flex flex-col gap-1 rounded-md border bg-gray-50 p-3 text-sm">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {hfr.name}
                {hfr.status && <Badge variant="outline">{hfr.status}</Badge>}
              </span>
              <span className="text-xs text-gray-600">
                {[hfr.facility_type, hfr.ownership, hfr.system_of_medicine]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="text-xs text-gray-600">
                {[hfr.address, hfr.district, hfr.state, hfr.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          {settings?.hip_id && registry && !hfr && !registry.hfr_error && (
            <p className="mt-3 text-sm text-red-700">
              {t("abdm_hfr_not_found", { hipId: settings.hip_id })}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSheet("search")}>
              {t("abdm_hfr_find")}
            </Button>
            {!settings?.hip_id && (
              <Button
                variant="ghost"
                onClick={() =>
                  setSheet(me?.hpr_signed_in ? "onboard" : "sign_in")
                }
              >
                {t("abdm_hfr_onboard")}
              </Button>
            )}
          </div>
          {!settings?.hip_id && me && !me.hpr_signed_in && (
            <p className="mt-2 text-xs text-gray-500">
              {t("abdm_hfr_onboard_needs_hpr")}
            </p>
          )}
        </CardContent>
      </Card>

      {settings?.hip_id && (
        <Card>
          <CardHeader>
            <CardTitle>{t("abdm_readiness")}</CardTitle>
          </CardHeader>
          <CardContent>
            {readiness.isLoading ? (
              <Loader2 className="size-5 animate-spin text-gray-500" />
            ) : readiness.data?.error ? (
              <Check ok={false} label={readiness.data.error} />
            ) : (
              <ul className="flex flex-col gap-2">
                <Check
                  ok={!!readiness.data?.hip_registered}
                  label={
                    readiness.data?.hip_registered
                      ? t("abdm_hip_registered", { hipId: settings.hip_id })
                      : t("abdm_hip_not_registered", { hipId: settings.hip_id })
                  }
                />
                <Check
                  ok={!!readiness.data?.bridge_url}
                  label={
                    readiness.data?.bridge_url
                      ? t("abdm_bridge_url", { url: readiness.data.bridge_url })
                      : t("abdm_bridge_url_missing")
                  }
                />
                <Check
                  ok={
                    !!readiness.data?.hiu_registered &&
                    !!readiness.data?.callback_base_url
                  }
                  label={
                    !readiness.data?.hiu_registered
                      ? t("abdm_hiu_not_registered", { hipId: settings.hip_id })
                      : readiness.data?.callback_base_url
                        ? t("abdm_hiu_ready", {
                            url: readiness.data.callback_base_url,
                          })
                        : t("abdm_hiu_no_push_url")
                  }
                />
              </ul>
            )}
            {readiness.data && !readiness.data.error && !servedHere && (
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  className="w-fit"
                  disabled={registerServices.isPending}
                  onClick={() => registerServices.mutate({})}
                >
                  {registerServices.isPending && (
                    <Loader2 className="animate-spin" />
                  )}
                  {t("abdm_register_services")}
                </Button>
                <p className="text-xs text-gray-500">
                  {t("abdm_register_services_hint")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AbdmProfessionalsCard facilityId={facilityId} />

      <AbdmHfrSearchSheet
        open={sheet === "search"}
        onOpenChange={(open) => setSheet(open ? "search" : null)}
        facilityId={facilityId}
        onPick={(facility) => save({ hip_id: facility.facility_id })}
      />
      {sheet === "onboard" && (
        <AbdmHfrOnboardSheet
          open
          onOpenChange={(open) => setSheet(open ? "onboard" : null)}
          facilityId={facilityId}
          application={registry?.application ?? null}
        />
      )}
      {sheet === "sign_in" && me && (
        <AbdmHprLinkSheet
          open
          onOpenChange={(open) =>
            // Signing in hands over to onboarding; only a plain close clears it
            !open &&
            setSheet((current) => (current === "sign_in" ? null : current))
          }
          facilityId={facilityId}
          member={{ username: me.username, name: t("abdm_yourself") }}
          onLinked={() => {
            queryClient.invalidateQueries({
              queryKey: ["abdm-registry", facilityId],
            });
            queryClient.invalidateQueries({
              queryKey: ["abdm-professionals", facilityId],
            });
            setSheet("onboard");
          }}
        />
      )}
    </div>
  );
}
