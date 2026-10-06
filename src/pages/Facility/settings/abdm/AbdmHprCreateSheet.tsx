import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  AbdmHprCategory,
  AbdmHprCreateStatus,
  AbdmProfessional,
  AbdmState,
} from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { AbdmOptionSelect as OptionSelect } from "./AbdmOptionSelect";
import { useAbdmMaster } from "./useAbdmMaster";

const STATUS_POLL_MS = 3000;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  member: { username: string; name: string };
  onLinked: (professional: AbdmProfessional) => void;
}

const EMPTY_DETAILS = {
  hpr_id: "",
  email: "",
  password: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  category: "",
  sub_category: "",
  state_code: "",
  district_code: "",
};

/**
 * Create an HPR ID for a professional. Aadhaar is entered on ABDM's own page,
 * never in CARE; CARE only learns when it has been verified.
 */
export function AbdmHprCreateSheet({
  open,
  onOpenChange,
  facilityId,
  member,
  onLinked,
}: Props) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const pathParams = { facilityId };

  const start = useMutation({
    mutationFn: mutate(registryApi.createStart, { pathParams }),
  });
  const journeyId = start.data?.journey_id;

  const status = useQuery<AbdmHprCreateStatus>({
    queryKey: ["abdm-hpr-create", journeyId],
    queryFn: query(registryApi.createStatus, {
      pathParams,
      body: { journey_id: journeyId ?? "" },
    }),
    enabled: !!journeyId,
    refetchInterval: (q) =>
      q.state.data?.authenticated ? false : STATUS_POLL_MS,
    refetchOnWindowFocus: false,
  });
  const verified = status.data?.authenticated;

  const checkMobile = useMutation({
    mutationFn: mutate(registryApi.createMobile, { pathParams }),
    onSuccess: (result: { mobile_verified: boolean; otp_sent: boolean }) =>
      setMobileVerified(result.mobile_verified),
  });
  const verifyOtp = useMutation({
    mutationFn: mutate(registryApi.createMobileOtp, { pathParams }),
    onSuccess: () => setMobileVerified(true),
  });
  const create = useMutation({
    mutationFn: mutate(registryApi.createHprId, { pathParams }),
    onSuccess: (professional: AbdmProfessional) => {
      onLinked(professional);
      onOpenChange(false);
    },
  });

  const categories = useAbdmMaster<AbdmHprCategory>(
    facilityId,
    "hpr_categories",
    {},
    !!verified,
  );
  const states = useAbdmMaster<AbdmState>(facilityId, "states", {}, !!verified);
  const subCategories =
    categories.find((c) => c.code === details.category)?.sub_categories ?? [];
  const districts =
    states.find((s) => s.code === details.state_code)?.districts ?? [];

  const prefill = status.data?.prefill;
  useEffect(() => {
    if (prefill) {
      setDetails((current) => ({ ...current, ...prefill }));
    }
  }, [prefill]);

  useEffect(() => {
    if (status.data?.linked) {
      onLinked(status.data.linked);
    }
  }, [status.data?.linked, onLinked]);

  const set = (key: keyof typeof EMPTY_DETAILS) => (value: string) =>
    setDetails((current) => ({ ...current, [key]: value }));

  const ready =
    mobileVerified &&
    details.hpr_id.trim() &&
    details.email.trim() &&
    details.password.length >= 8 &&
    details.category &&
    details.sub_category &&
    details.state_code &&
    details.district_code;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {t("abdm_hpr_create_title", { name: member.name })}
          </SheetTitle>
          <SheetDescription>{t("abdm_hpr_create_description")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {/* 1. Aadhaar, on ABDM's page */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("abdm_hpr_step_aadhaar")}</h3>
            {!start.data ? (
              <Button
                onClick={() => start.mutate({ username: member.username })}
                disabled={start.isPending}
                className="w-fit"
              >
                {start.isPending && <Loader2 className="animate-spin" />}
                {t("abdm_hpr_start")}
              </Button>
            ) : verified ? (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="size-4" aria-hidden />
                {t("abdm_hpr_aadhaar_verified")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-fit">
                  <a href={start.data.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden />
                    {t("abdm_hpr_open_aadhaar_page")}
                  </a>
                </Button>
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  {t("abdm_hpr_waiting_for_aadhaar")}
                </p>
              </div>
            )}
          </section>

          {status.data?.linked && (
            <p className="text-sm text-green-700">
              {t("abdm_hpr_existing_linked", {
                hprId: status.data.linked.hpr_id,
              })}
            </p>
          )}

          {verified && !status.data?.linked && (
            <>
              {/* 2. Mobile */}
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  {t("abdm_hpr_step_mobile")}
                </h3>
                {mobileVerified ? (
                  <p className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="size-4" aria-hidden />
                    {t("abdm_hpr_mobile_verified")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        aria-label={t("abdm_mobile")}
                        value={mobile}
                        onChange={(e) =>
                          setMobile(e.target.value.replace(/\D/g, ""))
                        }
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210"
                      />
                      <Button
                        variant="outline"
                        disabled={mobile.length !== 10 || checkMobile.isPending}
                        onClick={() =>
                          journeyId &&
                          checkMobile.mutate({ journey_id: journeyId, mobile })
                        }
                      >
                        {checkMobile.isPending && (
                          <Loader2 className="animate-spin" />
                        )}
                        {t("abdm_hpr_check_mobile")}
                      </Button>
                    </div>
                    {checkMobile.data?.otp_sent && (
                      <div className="flex gap-2">
                        <Input
                          aria-label={t("abdm_otp")}
                          value={otp}
                          onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, ""))
                          }
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder={t("abdm_otp")}
                        />
                        <Button
                          variant="outline"
                          disabled={otp.length < 6 || verifyOtp.isPending}
                          onClick={() =>
                            journeyId &&
                            verifyOtp.mutate({ journey_id: journeyId, otp })
                          }
                        >
                          {t("abdm_hpr_verify_otp")}
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {t("abdm_hpr_mobile_hint")}
                    </p>
                  </div>
                )}
              </section>

              {/* 3. HPR ID details */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">
                  {t("abdm_hpr_step_details")}
                </h3>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="abdm_new_hpr_id">{t("abdm_hpr_id")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="abdm_new_hpr_id"
                      value={details.hpr_id}
                      onChange={(e) => set("hpr_id")(e.target.value)}
                      autoComplete="off"
                    />
                    <span className="text-sm text-gray-500">@hpr.abdm</span>
                  </div>
                  {!!status.data?.suggestions?.length && (
                    <div className="flex flex-wrap gap-1">
                      {status.data.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => set("hpr_id")(suggestion)}
                        >
                          <Badge variant="outline">{suggestion}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(["first_name", "middle_name", "last_name"] as const).map(
                    (key) => (
                      <div key={key} className="flex flex-col gap-2">
                        <Label htmlFor={`abdm_${key}`}>{t(`abdm_${key}`)}</Label>
                        <Input
                          id={`abdm_${key}`}
                          value={details[key]}
                          onChange={(e) => set(key)(e.target.value)}
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="abdm_hpr_email">{t("abdm_email")}</Label>
                  <Input
                    id="abdm_hpr_email"
                    type="email"
                    value={details.email}
                    onChange={(e) => set("email")(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="abdm_hpr_password">
                    {t("abdm_hpr_password")}
                  </Label>
                  <Input
                    id="abdm_hpr_password"
                    type="password"
                    autoComplete="new-password"
                    value={details.password}
                    onChange={(e) => set("password")(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    {t("abdm_hpr_password_hint")}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionSelect
                    label={t("abdm_hpr_category")}
                    value={details.category}
                    options={categories}
                    onChange={(value) =>
                      setDetails((current) => ({
                        ...current,
                        category: value,
                        sub_category: "",
                      }))
                    }
                  />
                  <OptionSelect
                    label={t("abdm_hpr_sub_category")}
                    value={details.sub_category}
                    options={subCategories}
                    onChange={set("sub_category")}
                  />
                  <OptionSelect
                    label={t("abdm_hfr_state")}
                    value={details.state_code}
                    options={states}
                    onChange={(value) =>
                      setDetails((current) => ({
                        ...current,
                        state_code: value,
                        district_code: "",
                      }))
                    }
                  />
                  <OptionSelect
                    label={t("abdm_hfr_district")}
                    value={details.district_code}
                    options={districts}
                    onChange={set("district_code")}
                  />
                </div>
              </section>
            </>
          )}
        </div>

        {verified && !status.data?.linked && (
          <SheetFooter>
            <Button
              disabled={!ready || create.isPending}
              onClick={() =>
                journeyId &&
                create.mutate({
                  journey_id: journeyId,
                  ...details,
                  hpr_id: details.hpr_id.trim(),
                })
              }
            >
              {create.isPending && <Loader2 className="animate-spin" />}
              {t("abdm_hpr_create_and_link")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
