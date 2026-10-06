import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { AbdmHfrFacility, AbdmState } from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";

import { useAbdmMaster } from "./useAbdmMaster";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  onPick: (facility: AbdmHfrFacility) => void;
}

/** Find this facility in HFR by its ID, or by name within a state. */
export function AbdmHfrSearchSheet({
  open,
  onOpenChange,
  facilityId,
  onPick,
}: Props) {
  const { t } = useTranslation();
  const [hfrId, setHfrId] = useState("");
  const [name, setName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [ownership, setOwnership] = useState("");

  const states = useAbdmMaster<AbdmState>(facilityId, "states", {}, open);
  const ownerships = useAbdmMaster(facilityId, "master", { type: "OWNER" }, open);
  const districts = states.find((s) => s.code === stateCode)?.districts ?? [];

  const search = useMutation({
    mutationFn: mutate(registryApi.search, { pathParams: { facilityId } }),
  });

  const byId = hfrId.trim().length > 0;
  const canSearch = byId || (!!stateCode && !!ownership);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("abdm_hfr_find")}</SheetTitle>
          <SheetDescription>{t("abdm_hfr_find_description")}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            search.mutate(
              byId
                ? { facility_id: hfrId.trim() }
                : {
                    name: name.trim() || undefined,
                    state_code: stateCode,
                    district_code: districtCode || undefined,
                    ownership_code: ownership,
                  },
            );
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="abdm_hfr_id">{t("abdm_hfr_id")}</Label>
            <Input
              id="abdm_hfr_id"
              value={hfrId}
              onChange={(e) => setHfrId(e.target.value)}
              placeholder="IN0000000000"
            />
          </div>
          <p className="text-center text-xs text-gray-500">{t("abdm_or")}</p>
          <fieldset disabled={byId} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="abdm_hfr_name">{t("abdm_hfr_facility_name")}</Label>
              <Input
                id="abdm_hfr_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("abdm_hfr_state")}</Label>
                <Select
                  value={stateCode}
                  onValueChange={(value) => {
                    setStateCode(value);
                    setDistrictCode("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("abdm_select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("abdm_hfr_district")}</Label>
                <Select
                  value={districtCode}
                  onValueChange={setDistrictCode}
                  disabled={!districts.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("abdm_optional")} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.code} value={district.code}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("abdm_hfr_ownership")}</Label>
              <Select value={ownership} onValueChange={setOwnership}>
                <SelectTrigger>
                  <SelectValue placeholder={t("abdm_select")} />
                </SelectTrigger>
                <SelectContent>
                  {ownerships.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>
          <Button type="submit" disabled={!canSearch || search.isPending}>
            {search.isPending && <Loader2 className="animate-spin" />}
            {t("abdm_hfr_search")}
          </Button>
        </form>

        {search.data && (
          <div className="flex flex-col gap-2 p-4 pt-0">
            <p className="text-sm text-gray-600">
              {t("abdm_hfr_results", { count: search.data.total })}
            </p>
            <ul className="flex flex-col gap-2">
              {search.data.results.map((facility) => (
                <li
                  key={facility.facility_id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">{facility.name}</span>
                    <span className="font-mono text-xs text-gray-600">
                      {facility.facility_id}
                    </span>
                    <span className="text-xs text-gray-600">
                      {[facility.facility_type, facility.district, facility.state]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {facility.status && (
                      <Badge variant="outline" className="w-fit">
                        {facility.status}
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" onClick={() => onPick(facility)}>
                    {t("abdm_hfr_use")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
