import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, endOfDay, startOfDay, subYears } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ABDM_HI_TYPES, ABDM_PURPOSES } from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import mutate from "@/Utils/request/mutate";

const DEFAULT_LOOKBACK_YEARS = 5;
const DEFAULT_ACCESS_DAYS = 30;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  facilityId: string;
  abhaAddress: string;
}

/** Ask the patient, through their consent manager, for records other providers hold. */
export function AbdmConsentRequestSheet({
  open,
  onOpenChange,
  patientId,
  facilityId,
  abhaAddress,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState<string>("CAREMGT");
  const [hiTypes, setHiTypes] = useState<string[]>([...ABDM_HI_TYPES]);
  const [from, setFrom] = useState<Date | undefined>(
    subYears(new Date(), DEFAULT_LOOKBACK_YEARS),
  );
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [until, setUntil] = useState<Date | undefined>(
    addDays(new Date(), DEFAULT_ACCESS_DAYS),
  );

  const { mutate: create, isPending } = useMutation({
    mutationFn: mutate(hipApi.createConsentRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abdm-patient", patientId] });
      onOpenChange(false);
    },
  });

  const valid =
    hiTypes.length > 0 && from && to && until && from < to && until > new Date();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("abdm_request_records")}</SheetTitle>
          <SheetDescription>
            {t("abdm_request_records_description", { address: abhaAddress })}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <Label>{t("abdm_consent_purpose")}</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ABDM_PURPOSES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {t(`abdm_purpose__${code}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              {t("abdm_record_types")}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ABDM_HI_TYPES.map((type) => (
                <Label key={type} className="flex items-center gap-2 font-normal">
                  <Checkbox
                    checked={hiTypes.includes(type)}
                    onCheckedChange={(checked) =>
                      setHiTypes((current) =>
                        checked
                          ? [...current, type]
                          : current.filter((value) => value !== type),
                      )
                    }
                  />
                  {type}
                </Label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label>{t("abdm_records_from_to")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <DatePicker
                date={from}
                onChange={setFrom}
                disabled={(date) => date > new Date()}
              />
              <span className="text-sm text-gray-500">–</span>
              <DatePicker
                date={to}
                onChange={setTo}
                disabled={(date) => date > new Date()}
              />
            </div>
            <p className="text-xs text-gray-500">
              {t("abdm_records_from_to_hint")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("abdm_access_until")}</Label>
            <DatePicker
              date={until}
              onChange={setUntil}
              disabled={(date) => date <= new Date()}
            />
            <p className="text-xs text-gray-500">{t("abdm_access_until_hint")}</p>
          </div>
        </div>
        <SheetFooter>
          <Button
            disabled={!valid || isPending}
            onClick={() =>
              from &&
              to &&
              until &&
              create({
                patient: patientId,
                facility: facilityId,
                purpose,
                hi_types: hiTypes,
                date_from: startOfDay(from).toISOString(),
                date_to: endOfDay(to).toISOString(),
                data_erase_at: endOfDay(until).toISOString(),
              })
            }
          >
            {t("abdm_send_request")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
