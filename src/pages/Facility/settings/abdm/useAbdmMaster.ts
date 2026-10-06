import { useQuery } from "@tanstack/react-query";

import { AbdmMasterKind, AbdmOption } from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import query from "@/Utils/request/query";

/** HFR and HPR master data, proxied by CARE; these lists rarely change. */
export function useAbdmMaster<T = AbdmOption>(
  facilityId: string,
  kind: AbdmMasterKind,
  params: Record<string, string> = {},
  enabled = true,
): T[] {
  const { data } = useQuery({
    queryKey: ["abdm-master", facilityId, kind, params],
    queryFn: query(registryApi.masters, {
      pathParams: { facilityId },
      queryParams: { kind, ...params },
    }),
    enabled,
    staleTime: Infinity,
  });
  return (data?.results ?? []) as T[];
}
