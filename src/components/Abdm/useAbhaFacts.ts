import { useCallback, useState } from "react";

export type AbhaFactKey = "mobile" | "aadhaar" | "abha_number";

export type AbhaFactSource = "patient_search" | "desk" | "abha_profile";

interface AbhaFact {
  value: string;
  source: AbhaFactSource;
}

/**
 * One store of what the desk already knows about the patient in front of it.
 * Facts are write-once so a later step can never silently replace one, and
 * every step asks only for what is still missing.
 */
export function useAbhaFacts(initial: Partial<Record<AbhaFactKey, AbhaFact>>) {
  const [facts, setFacts] =
    useState<Partial<Record<AbhaFactKey, AbhaFact>>>(initial);

  const remember = useCallback(
    (key: AbhaFactKey, value: string, source: AbhaFactSource) => {
      setFacts((current) =>
        current[key] ? current : { ...current, [key]: { value, source } },
      );
    },
    [],
  );

  const forget = useCallback((key: AbhaFactKey) => {
    setFacts(({ [key]: _, ...rest }) => rest);
  }, []);

  return { facts, remember, forget };
}
