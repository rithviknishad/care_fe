import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AbdmHfrApplication,
  AbdmHfrOnboard,
  AbdmOption,
  AbdmState,
} from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";

import { AbdmOptionSelect } from "./AbdmOptionSelect";
import { useAbdmMaster } from "./useAbdmMaster";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const FUNCTIONAL = "F";

const EMPTY: AbdmHfrOnboard = {
  name: "",
  state_code: "",
  district_code: "",
  sub_district_code: "",
  region: "",
  address_line1: "",
  address_line2: "",
  pincode: "",
  latitude: "",
  longitude: "",
  email: "",
  phone: "",
  website: "",
  ownership_code: "",
  ownership_sub_type_code: "",
  ownership_sub_type_code2: "",
  system_of_medicine_codes: [],
  type_of_service_codes: [],
  facility_type_code: "",
  facility_sub_type_code: "",
  speciality_type_code: "",
  operational_status: "",
  timings: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  application: AbdmHfrApplication | null;
}

/** Register this facility in HFR, signed by the admin's own HPR login. */
export function AbdmHfrOnboardSheet({
  open,
  onOpenChange,
  facilityId,
  application,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AbdmHfrOnboard>({
    ...EMPTY,
    ...application?.information,
  });
  const [days, setDays] = useState<string[]>(
    form.timings.map((timing) => timing.working_days),
  );
  const [hours, setHours] = useState(
    form.timings[0]?.opening_hours ?? "9:00 AM - 6:00 PM",
  );

  const set =
    <K extends keyof AbdmHfrOnboard>(key: K) =>
    (value: AbdmHfrOnboard[K]) =>
      setForm((current) => ({ ...current, [key]: value }));

  const states = useAbdmMaster<AbdmState>(facilityId, "states", {}, open);
  const districts =
    states.find((s) => s.code === form.state_code)?.districts ?? [];
  const subDistricts = useAbdmMaster(
    facilityId,
    "sub_districts",
    { district: form.district_code },
    open && !!form.district_code,
  );
  const regions = useAbdmMaster(
    facilityId,
    "master",
    { type: "FACILITY-REGION" },
    open,
  );
  const ownerships = useAbdmMaster(facilityId, "master", { type: "OWNER" }, open);
  const ownershipSubTypes = useAbdmMaster(
    facilityId,
    "ownership_sub_types",
    { ownership: form.ownership_code },
    open && !!form.ownership_code,
  );
  // HFR lists a second level only for central government and private facilities
  const hasSecondLevel =
    !!form.ownership_sub_type_code &&
    (form.ownership_code !== "G" || form.ownership_sub_type_code === "C");
  const ownerSubTypes = useAbdmMaster(
    facilityId,
    "owner_sub_types",
    { ownership: form.ownership_code, sub_type: form.ownership_sub_type_code },
    open && hasSecondLevel,
  );
  const medicines = useAbdmMaster(
    facilityId,
    "master",
    { type: "MEDICINE" },
    open,
  );
  const services = useAbdmMaster(
    facilityId,
    "master",
    { type: "TYPE-SERVICE" },
    open,
  );
  const medicineCodes = form.system_of_medicine_codes.join(",");
  const facilityTypes = useAbdmMaster(
    facilityId,
    "facility_types",
    { ownership: form.ownership_code, medicine: medicineCodes },
    open && !!form.ownership_code && !!medicineCodes,
  );
  const facilitySubTypes = useAbdmMaster(
    facilityId,
    "facility_sub_types",
    { type: form.facility_type_code },
    open && !!form.facility_type_code,
  );
  const specialities = useAbdmMaster(
    facilityId,
    "master",
    { type: "SPECIALITY-TYPE" },
    open,
  );
  const statuses = useAbdmMaster(
    facilityId,
    "master",
    { type: "FAC-STATUS" },
    open,
  );

  const onboard = useMutation({
    mutationFn: mutate(registryApi.onboard, { pathParams: { facilityId } }),
    onSuccess: (result: AbdmHfrApplication) => {
      queryClient.invalidateQueries({ queryKey: ["abdm-registry", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["abdm-facility", facilityId] });
      if (result.hfr_id) {
        onOpenChange(false);
      }
    },
  });
  const result = onboard.data ?? application;

  const functional = form.operational_status === FUNCTIONAL;
  const ready =
    form.name.trim() &&
    form.state_code &&
    form.district_code &&
    form.sub_district_code &&
    form.region &&
    form.address_line1.trim() &&
    /^\d{6}$/.test(form.pincode) &&
    form.latitude &&
    form.longitude &&
    form.email.trim() &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    form.ownership_code &&
    form.ownership_sub_type_code &&
    form.system_of_medicine_codes.length &&
    form.facility_type_code &&
    form.speciality_type_code &&
    form.operational_status &&
    (!functional || (days.length && hours.trim()));

  const text = (key: keyof AbdmHfrOnboard, label: string, type = "text") => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`abdm_hfr_${key}`}>{label}</Label>
      <Input
        id={`abdm_hfr_${key}`}
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key)(e.target.value as never)}
      />
    </div>
  );

  const multi = (
    key: "system_of_medicine_codes" | "type_of_service_codes",
    label: string,
    options: AbdmOption[],
  ) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <Label
            key={option.code}
            className="flex items-center gap-2 font-normal"
          >
            <Checkbox
              checked={form[key].includes(option.code)}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  [key]: checked
                    ? [...current[key], option.code]
                    : current[key].filter((code) => code !== option.code),
                  ...(key === "system_of_medicine_codes"
                    ? { facility_type_code: "", facility_sub_type_code: "" }
                    : {}),
                }))
              }
            />
            {option.name}
          </Label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("abdm_hfr_onboard")}</SheetTitle>
          <SheetDescription>{t("abdm_hfr_onboard_description")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {result?.error_message && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {result.error_code && (
                <span className="font-mono">{result.error_code}: </span>
              )}
              {result.error_message}
              {result.tracking_id && (
                <span className="mt-1 block text-xs text-red-700">
                  {t("abdm_hfr_tracking_id", { id: result.tracking_id })}
                </span>
              )}
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{t("abdm_hfr_identity")}</h3>
            {text("name", t("abdm_hfr_facility_name"))}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AbdmOptionSelect
                label={t("abdm_hfr_ownership")}
                value={form.ownership_code}
                options={ownerships}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    ownership_code: value,
                    ownership_sub_type_code: "",
                    ownership_sub_type_code2: "",
                    facility_type_code: "",
                    facility_sub_type_code: "",
                  }))
                }
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_ownership_sub_type")}
                value={form.ownership_sub_type_code}
                options={ownershipSubTypes}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    ownership_sub_type_code: value,
                    ownership_sub_type_code2: "",
                  }))
                }
              />
              {hasSecondLevel && (
                <AbdmOptionSelect
                  label={t("abdm_hfr_ownership_sub_type2")}
                  value={form.ownership_sub_type_code2}
                  options={ownerSubTypes}
                  onChange={set("ownership_sub_type_code2")}
                />
              )}
            </div>
            {multi(
              "system_of_medicine_codes",
              t("abdm_hfr_system_of_medicine"),
              medicines,
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AbdmOptionSelect
                label={t("abdm_hfr_facility_type")}
                value={form.facility_type_code}
                options={facilityTypes}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    facility_type_code: value,
                    facility_sub_type_code: "",
                  }))
                }
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_facility_sub_type")}
                value={form.facility_sub_type_code}
                options={facilitySubTypes}
                onChange={set("facility_sub_type_code")}
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_speciality_type")}
                value={form.speciality_type_code}
                options={specialities}
                onChange={set("speciality_type_code")}
              />
            </div>
            {multi("type_of_service_codes", t("abdm_hfr_services"), services)}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{t("abdm_hfr_address")}</h3>
            {text("address_line1", t("abdm_hfr_address_line1"))}
            {text("address_line2", t("abdm_hfr_address_line2"))}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AbdmOptionSelect
                label={t("abdm_hfr_state")}
                value={form.state_code}
                options={states}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    state_code: value,
                    district_code: "",
                    sub_district_code: "",
                  }))
                }
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_district")}
                value={form.district_code}
                options={districts}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    district_code: value,
                    sub_district_code: "",
                  }))
                }
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_sub_district")}
                value={form.sub_district_code}
                options={subDistricts}
                onChange={set("sub_district_code")}
              />
              <AbdmOptionSelect
                label={t("abdm_hfr_region")}
                value={form.region}
                options={regions}
                onChange={set("region")}
              />
              {text("pincode", t("abdm_hfr_pincode"))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {text("latitude", t("abdm_hfr_latitude"))}
              {text("longitude", t("abdm_hfr_longitude"))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{t("abdm_hfr_contact")}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {text("email", t("abdm_email"), "email")}
              {text("phone", t("abdm_hfr_phone"), "tel")}
              {text("website", t("abdm_hfr_website"), "url")}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{t("abdm_hfr_operations")}</h3>
            <AbdmOptionSelect
              label={t("abdm_hfr_operational_status")}
              value={form.operational_status}
              options={statuses}
              onChange={set("operational_status")}
            />
            {functional && (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-medium">
                    {t("abdm_hfr_working_days")}
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {WEEKDAYS.map((day) => (
                      <Label
                        key={day}
                        className="flex items-center gap-2 font-normal"
                      >
                        <Checkbox
                          checked={days.includes(day)}
                          onCheckedChange={(checked) =>
                            setDays((current) =>
                              checked
                                ? [...current, day]
                                : current.filter((value) => value !== day),
                            )
                          }
                        />
                        {t(`abdm_weekday__${day}`)}
                      </Label>
                    ))}
                  </div>
                </fieldset>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="abdm_hfr_hours">
                    {t("abdm_hfr_opening_hours")}
                  </Label>
                  <Input
                    id="abdm_hfr_hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>
              </>
            )}
          </section>
        </div>

        <SheetFooter>
          <Button
            disabled={!ready || onboard.isPending}
            onClick={() =>
              onboard.mutate({
                ...form,
                timings: functional
                  ? WEEKDAYS.filter((day) => days.includes(day)).map((day) => ({
                      working_days: day,
                      opening_hours: hours.trim(),
                    }))
                  : [],
              })
            }
          >
            {onboard.isPending && <Loader2 className="animate-spin" />}
            {t("abdm_hfr_submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
