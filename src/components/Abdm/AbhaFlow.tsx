import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAbhaFacts } from "@/components/Abdm/useAbhaFacts";

import {
  AbhaAccount,
  AbhaApiError,
  AbhaOtpSystem,
  AbhaProfile,
} from "@/types/abdm/abha";
import abhaApi from "@/types/abdm/abhaApi";
import { HTTPError } from "@/Utils/request/types";
import { callApi } from "@/Utils/request/query";
import careConfig from "@careConfig";

const OTP_LENGTH = 6;

type LoginRequestBody = NonNullable<typeof abhaApi.loginRequestOtp.TBody>;

type Identifier = "mobile" | "aadhaar" | "abha_number";

type Step =
  | { kind: "identify" }
  | { kind: "accounts"; accounts: AbhaAccount[] }
  | { kind: "not_found"; via: Identifier }
  | { kind: "login_otp"; message?: string | null }
  | { kind: "choose_account"; accounts: AbhaAccount[] }
  | { kind: "enrol_aadhaar" }
  | { kind: "enrol_otp"; message?: string | null }
  | { kind: "enrol_mobile_otp"; message?: string | null }
  | { kind: "address"; suggestions: string[] };

interface AbhaFlowProps {
  initialMobile?: string;
  initialAbhaNumber?: string;
  onComplete: (profile: AbhaProfile) => void;
}

/** An Indian mobile from CARE's E.164 phone number, or nothing. */
export function toAbhaMobile(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return undefined;
}

function apiError(error: unknown): AbhaApiError {
  if (error instanceof HTTPError) {
    const errors = (error.cause as { errors?: AbhaApiError[] })?.errors;
    if (Array.isArray(errors) && errors[0]) return errors[0];
    const detail = (error.cause as { detail?: string })?.detail;
    if (detail) return { type: "error", msg: detail };
  }
  return { type: "error", msg: (error as Error)?.message || "" };
}

function useAbhaCall<TArgs, TRes>(fn: (args: TArgs) => Promise<TRes>) {
  return useMutation<TRes, unknown, TArgs>({ mutationFn: fn });
}

export function AbhaFlow({
  initialMobile,
  initialAbhaNumber,
  onComplete,
}: AbhaFlowProps) {
  const { t } = useTranslation();
  const mobileFromSearch = initialAbhaNumber
    ? undefined
    : toAbhaMobile(initialMobile);
  const { facts, remember, forget } = useAbhaFacts(
    mobileFromSearch
      ? { mobile: { value: mobileFromSearch, source: "patient_search" } }
      : {},
  );

  const [step, setStep] = useState<Step>({ kind: "identify" });
  const [journeyId, setJourneyId] = useState<string>();
  const [error, setError] = useState<AbhaApiError | null>(null);
  const [identifier, setIdentifier] = useState<Identifier>(
    initialAbhaNumber ? "abha_number" : mobileFromSearch ? "mobile" : "aadhaar",
  );
  const [value, setValue] = useState(
    initialAbhaNumber ?? mobileFromSearch ?? "",
  );
  const [otpSystem, setOtpSystem] = useState<AbhaOtpSystem>("aadhaar");
  const [otp, setOtp] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [consent, setConsent] = useState(false);
  const [enrolledProfile, setEnrolledProfile] = useState<AbhaProfile>();
  const [isNewAbha, setIsNewAbha] = useState(false);
  const [abhaAddress, setAbhaAddress] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [lastOtpRequest, setLastOtpRequest] = useState<() => void>();

  const goTo = (next: Step) => {
    setError(null);
    setOtp("");
    setStep(next);
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const silent = { silent: true } as const;

  const search = useAbhaCall((mobile: string) =>
    callApi(abhaApi.search, { ...silent, body: { mobile } }),
  );
  const loginRequestOtp = useAbhaCall((body: LoginRequestBody) =>
    callApi(abhaApi.loginRequestOtp, { ...silent, body }),
  );
  const loginVerifyOtp = useAbhaCall((body: { journey_id: string; otp: string }) =>
    callApi(abhaApi.loginVerifyOtp, { ...silent, body }),
  );
  const loginSelectAccount = useAbhaCall(
    (body: { journey_id: string; abha_number: string }) =>
      callApi(abhaApi.loginSelectAccount, { ...silent, body }),
  );
  const fetchProfile = useAbhaCall((journey_id: string) =>
    callApi(abhaApi.profile, { ...silent, queryParams: { journey_id } }),
  );
  const enrolRequestOtp = useAbhaCall((aadhaar: string) =>
    callApi(abhaApi.enrolRequestOtp, { ...silent, body: { aadhaar } }),
  );
  const enrolVerifyOtp = useAbhaCall(
    (body: { journey_id: string; otp: string; mobile: string }) =>
      callApi(abhaApi.enrolVerifyOtp, { ...silent, body }),
  );
  const enrolMobileRequestOtp = useAbhaCall(
    (body: { journey_id: string; mobile: string }) =>
      callApi(abhaApi.enrolMobileRequestOtp, { ...silent, body }),
  );
  const enrolMobileVerifyOtp = useAbhaCall(
    (body: { journey_id: string; otp: string }) =>
      callApi(abhaApi.enrolMobileVerifyOtp, { ...silent, body }),
  );
  const addressSuggestions = useAbhaCall((journey_id: string) =>
    callApi(abhaApi.enrolAddressSuggestions, {
      ...silent,
      queryParams: { journey_id },
    }),
  );
  const enrolAddress = useAbhaCall(
    (body: { journey_id: string; abha_address: string }) =>
      callApi(abhaApi.enrolAddress, { ...silent, body }),
  );

  const isPending = [
    search,
    loginRequestOtp,
    loginVerifyOtp,
    loginSelectAccount,
    fetchProfile,
    enrolRequestOtp,
    enrolVerifyOtp,
    enrolMobileRequestOtp,
    enrolMobileVerifyOtp,
    addressSuggestions,
    enrolAddress,
  ].some((m) => m.isPending);

  const fail = (e: unknown) => setError(apiError(e));

  const startResendTimer = (request: () => void) => {
    setResendIn(careConfig.resendOtpTimeout);
    setLastOtpRequest(() => request);
  };

  const runSearch = (mobile: string) => {
    search.mutate(mobile, {
      onSuccess: (res) => {
        setJourneyId(res.journey_id);
        goTo({ kind: "accounts", accounts: res.accounts });
      },
      onError: (e) =>
        apiError(e).type === "abha_not_found"
          ? goTo({ kind: "not_found", via: "mobile" })
          : fail(e),
    });
  };

  // The desk already holds the mobile from patient search, so look it up straight away
  useEffect(() => {
    if (mobileFromSearch) runSearch(mobileFromSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLoginOtp = (body: LoginRequestBody, via: Identifier) => {
    const send = () =>
      loginRequestOtp.mutate(body, {
        onSuccess: (res) => {
          setJourneyId(res.journey_id);
          goTo({ kind: "login_otp", message: res.message });
          startResendTimer(send);
        },
        onError: (e) =>
          apiError(e).type === "abha_not_found"
            ? goTo({ kind: "not_found", via })
            : fail(e),
      });
    send();
  };

  const handleIdentify = () => {
    const input = value.trim();
    if (identifier === "mobile") {
      const mobile = toAbhaMobile(input);
      if (!mobile) return setError({ type: "error", msg: t("abha_mobile_invalid") });
      remember("mobile", mobile, "desk");
      return runSearch(mobile);
    }
    if (identifier === "aadhaar") {
      remember("aadhaar", input.replace(/\D/g, ""), "desk");
      return requestLoginOtp(
        { identifier_type: "aadhaar", value: input, otp_system: "aadhaar" },
        "aadhaar",
      );
    }
    remember("abha_number", input, "desk");
    requestLoginOtp(
      { identifier_type: "abha_number", value: input, otp_system: otpSystem },
      "abha_number",
    );
  };

  const completeWithProfile = (id: string) =>
    fetchProfile.mutate(id, {
      onSuccess: (res) => onComplete(res.profile),
      onError: fail,
    });

  const selectAccount = (id: string, account: AbhaAccount) =>
    loginSelectAccount.mutate(
      { journey_id: id, abha_number: account.abha_number || "" },
      { onSuccess: () => completeWithProfile(id), onError: fail },
    );

  const handleLoginOtp = () => {
    if (!journeyId) return;
    loginVerifyOtp.mutate(
      { journey_id: journeyId, otp },
      {
        onSuccess: (res) => {
          if (res.status === "verified") return completeWithProfile(journeyId);
          if (res.accounts.length === 1) {
            return selectAccount(journeyId, res.accounts[0]);
          }
          goTo({ kind: "choose_account", accounts: res.accounts });
        },
        onError: fail,
      },
    );
  };

  const handleEnrolAadhaar = () => {
    const aadhaar = facts.aadhaar?.value || aadhaarInput.replace(/\D/g, "");
    remember("aadhaar", aadhaar, "desk");
    const send = () =>
      enrolRequestOtp.mutate(aadhaar, {
        onSuccess: (res) => {
          setJourneyId(res.journey_id);
          goTo({ kind: "enrol_otp", message: res.message });
          startResendTimer(send);
        },
        onError: fail,
      });
    send();
  };

  const goToAddressOrFinish = (id: string, profile: AbhaProfile, isNew: boolean) => {
    if (!isNew) return onComplete(profile);
    addressSuggestions.mutate(id, {
      onSuccess: (res) => goTo({ kind: "address", suggestions: res.suggestions }),
      onError: () => goTo({ kind: "address", suggestions: [] }),
    });
  };

  const handleEnrolOtp = () => {
    if (!journeyId) return;
    const mobile = facts.mobile?.value || toAbhaMobile(mobileInput);
    if (!mobile) return setError({ type: "error", msg: t("abha_mobile_invalid") });
    remember("mobile", mobile, "desk");
    enrolVerifyOtp.mutate(
      { journey_id: journeyId, otp, mobile },
      {
        onSuccess: (res) => {
          setEnrolledProfile(res.profile);
          setIsNewAbha(res.is_new);
          if (!res.mobile_verification_required) {
            return goToAddressOrFinish(journeyId, res.profile, res.is_new);
          }
          const send = () =>
            enrolMobileRequestOtp.mutate(
              { journey_id: journeyId, mobile },
              {
                onSuccess: (r) => {
                  goTo({ kind: "enrol_mobile_otp", message: r.message });
                  startResendTimer(send);
                },
                onError: fail,
              },
            );
          send();
        },
        onError: fail,
      },
    );
  };

  const handleEnrolMobileOtp = () => {
    if (!journeyId || !enrolledProfile) return;
    enrolMobileVerifyOtp.mutate(
      { journey_id: journeyId, otp },
      {
        onSuccess: (res) => {
          if (!res.verified) {
            return setError({ type: "error", msg: res.message || "" });
          }
          goToAddressOrFinish(journeyId, enrolledProfile, isNewAbha);
        },
        onError: fail,
      },
    );
  };

  const handleAddress = (address: string) => {
    if (!journeyId || !enrolledProfile) return;
    enrolAddress.mutate(
      { journey_id: journeyId, abha_address: address },
      {
        onSuccess: (res) =>
          onComplete({
            ...enrolledProfile,
            abha_number: res.abha_number || enrolledProfile.abha_number,
            abha_address: res.abha_address,
          }),
        onError: fail,
      },
    );
  };

  const startOver = () => {
    setJourneyId(undefined);
    setValue("");
    goTo({ kind: "identify" });
  };

  const otpInput = (
    <div className="flex justify-center">
      <InputOTP
        id="abha_otp"
        aria-label={t("abha_enter_otp")}
        maxLength={OTP_LENGTH}
        value={otp}
        onChange={setOtp}
        pattern={REGEXP_ONLY_DIGITS}
        autoFocus
      >
        <InputOTPGroup>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );

  const resendButton = (
    <Button
      type="button"
      variant="link"
      size="sm"
      disabled={resendIn > 0 || isPending || !lastOtpRequest}
      onClick={() => lastOtpRequest?.()}
    >
      {resendIn > 0
        ? t("abha_resend_otp_in", { seconds: resendIn })
        : t("resend_otp")}
    </Button>
  );

  const accountRow = (account: AbhaAccount, onPick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={onPick}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-md border border-gray-200 p-3 text-left hover:bg-gray-50 focus-visible:ring-1 focus-visible:outline-hidden disabled:opacity-50"
    >
      {account.photo ? (
        <img
          src={`data:image/jpeg;base64,${account.photo}`}
          alt=""
          className="size-10 rounded-full object-cover"
        />
      ) : (
        <div className="size-10 rounded-full bg-gray-100" aria-hidden />
      )}
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{account.name}</span>
        <span className="text-sm text-gray-600">
          {[account.abha_number, account.abha_address, account.gender]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
    </button>
  );

  const content = (() => {
    switch (step.kind) {
      case "identify":
        return (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleIdentify();
            }}
          >
            <Tabs
              value={identifier}
              onValueChange={(v) => {
                setIdentifier(v as Identifier);
                setValue("");
                setError(null);
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="mobile">{t("abha_mobile")}</TabsTrigger>
                <TabsTrigger value="aadhaar">{t("abha_aadhaar")}</TabsTrigger>
                <TabsTrigger value="abha_number">
                  {t("abha_number")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col gap-2">
              <Label htmlFor="abha_identifier">
                {t(`abha_enter_${identifier}`)}
              </Label>
              <Input
                id="abha_identifier"
                inputMode="numeric"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
            {identifier === "abha_number" && (
              <div className="flex flex-col gap-2">
                <Label>{t("abha_verify_using")}</Label>
                <Tabs
                  value={otpSystem}
                  onValueChange={(v) => setOtpSystem(v as AbhaOtpSystem)}
                >
                  <TabsList>
                    <TabsTrigger value="aadhaar">
                      {t("abha_aadhaar_otp")}
                    </TabsTrigger>
                    <TabsTrigger value="abdm">{t("abha_mobile_otp")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            <Button type="submit" disabled={isPending || !value.trim()}>
              {t("abha_find")}
            </Button>
          </form>
        );

      case "accounts":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              {t("abha_accounts_on_mobile", { mobile: facts.mobile?.value })}
            </p>
            {step.accounts.map((account, i) =>
              accountRow(
                account,
                () =>
                  requestLoginOtp(
                    {
                      journey_id: journeyId,
                      identifier_type: "mobile_index",
                      value: String(account.index),
                    },
                    "mobile",
                  ),
                `${account.index ?? i}`,
              ),
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => goTo({ kind: "enrol_aadhaar" })}
              disabled={isPending}
            >
              {t("abha_none_of_these")}
            </Button>
          </div>
        );

      case "not_found":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              {t(`abha_not_found_${step.via}`)}
            </p>
            <Button type="button" onClick={() => goTo({ kind: "enrol_aadhaar" })}>
              {t("abha_create_with_aadhaar")}
            </Button>
            <Button type="button" variant="outline" onClick={startOver}>
              {t("abha_try_another_identifier")}
            </Button>
          </div>
        );

      case "login_otp":
      case "enrol_mobile_otp":
        return (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (step.kind === "login_otp") handleLoginOtp();
              else handleEnrolMobileOtp();
            }}
          >
            {step.message && (
              <p className="text-sm text-gray-700">{step.message}</p>
            )}
            {otpInput}
            <div className="flex items-center justify-between">
              {resendButton}
              <Button
                type="submit"
                disabled={isPending || otp.length !== OTP_LENGTH}
              >
                {t("verify_otp")}
              </Button>
            </div>
          </form>
        );

      case "choose_account":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">{t("abha_choose_account")}</p>
            {step.accounts.map((account, i) =>
              accountRow(
                account,
                () => journeyId && selectAccount(journeyId, account),
                account.abha_number ?? `${i}`,
              ),
            )}
          </div>
        );

      case "enrol_aadhaar":
        return (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleEnrolAadhaar();
            }}
          >
            {facts.aadhaar ? (
              <p className="text-sm text-gray-700">
                {t("abha_create_using_aadhaar_ending", {
                  digits: facts.aadhaar.value.slice(-4),
                })}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => forget("aadhaar")}
                >
                  {t("change")}
                </Button>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="abha_aadhaar">{t("abha_enter_aadhaar")}</Label>
                <Input
                  id="abha_aadhaar"
                  inputMode="numeric"
                  autoComplete="off"
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <Checkbox
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <span>{t("abha_enrolment_consent")}</span>
            </label>
            <Button
              type="submit"
              disabled={
                isPending ||
                !consent ||
                (!facts.aadhaar &&
                  aadhaarInput.replace(/\D/g, "").length !== 12)
              }
            >
              {t("abha_send_aadhaar_otp")}
            </Button>
          </form>
        );

      case "enrol_otp":
        return (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleEnrolOtp();
            }}
          >
            {step.message && (
              <p className="text-sm text-gray-700">{step.message}</p>
            )}
            {otpInput}
            {facts.mobile ? (
              <p className="text-sm text-gray-600">
                {t("abha_mobile_from_earlier", {
                  mobile: facts.mobile.value,
                })}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="abha_enrol_mobile">
                  {t("abha_enter_mobile")}
                </Label>
                <Input
                  id="abha_enrol_mobile"
                  inputMode="numeric"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              {resendButton}
              <Button
                type="submit"
                disabled={isPending || otp.length !== OTP_LENGTH}
              >
                {t("abha_create")}
              </Button>
            </div>
          </form>
        );

      case "address":
        return (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddress(abhaAddress);
            }}
          >
            <p className="text-sm text-gray-700">
              {t("abha_address_created_number", {
                number: enrolledProfile?.abha_number,
              })}
            </p>
            {step.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant={abhaAddress === suggestion ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setAbhaAddress(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="abha_address">{t("abha_address")}</Label>
              <Input
                id="abha_address"
                value={abhaAddress}
                onChange={(e) => setAbhaAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {t("abha_address_rules")}
              </p>
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => enrolledProfile && onComplete(enrolledProfile)}
              >
                {t("abha_use_default_address")}
              </Button>
              <Button type="submit" disabled={isPending || !abhaAddress}>
                {t("abha_create_address")}
              </Button>
            </div>
          </form>
        );
    }
  })();

  return (
    <div className="flex flex-col gap-4" aria-busy={isPending}>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>{error.msg || t("something_went_wrong")}</AlertTitle>
          {error.request_id && (
            <AlertDescription>
              {t("abha_request_reference", { id: error.request_id })}
            </AlertDescription>
          )}
        </Alert>
      )}
      {isPending && step.kind === "identify" && !!mobileFromSearch ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="size-4 animate-spin" />
          {t("abha_looking_up_mobile", { mobile: mobileFromSearch })}
        </div>
      ) : (
        content
      )}
    </div>
  );
}
