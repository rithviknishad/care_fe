import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AbdmOption } from "@/types/abdm/registry";

/** A labelled select over registry master data. */
export function AbdmOptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: AbdmOption[];
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={!options.length}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={t("abdm_select")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
