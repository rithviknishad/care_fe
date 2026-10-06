import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AbdmFacilityMember } from "@/types/abdm/registry";
import registryApi from "@/types/abdm/registryApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { AbdmHprCreateSheet } from "./AbdmHprCreateSheet";
import { AbdmHprLinkSheet } from "./AbdmHprLinkSheet";

/** This facility's staff and the HPR IDs they are linked to. */
export function AbdmProfessionalsCard({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{
    member: AbdmFacilityMember;
    mode: "link" | "create";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["abdm-professionals", facilityId],
    queryFn: query(registryApi.professionals, { pathParams: { facilityId } }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["abdm-professionals", facilityId],
    });
    queryClient.invalidateQueries({ queryKey: ["abdm-registry", facilityId] });
  }, [queryClient, facilityId]);

  const unlink = useMutation({
    mutationFn: mutate(registryApi.unlink, { pathParams: { facilityId } }),
    onSuccess: refresh,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("abdm_professionals")}</CardTitle>
        <CardDescription>{t("abdm_professionals_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-gray-500" />
        ) : !data?.results.length ? (
          <p className="text-sm text-gray-500">{t("abdm_professionals_none")}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {data.results.map((member) => (
              <li
                key={member.username}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{member.name}</span>
                  {member.professional ? (
                    <span className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <Badge variant="outline" className="gap-1">
                        <BadgeCheck className="size-3 text-green-600" aria-hidden />
                        {member.professional.hpr_id}
                      </Badge>
                      <span className="font-mono">
                        {member.professional.hpr_id_number}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {t("abdm_hpr_not_linked")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {member.professional ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={unlink.isPending}
                      onClick={() => unlink.mutate({ username: member.username })}
                    >
                      {t("abdm_hpr_unlink")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected({ member, mode: "link" })}
                      >
                        {t("abdm_hpr_link")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected({ member, mode: "create" })}
                      >
                        {t("abdm_hpr_create")}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {selected?.mode === "link" && (
        <AbdmHprLinkSheet
          open
          onOpenChange={(open) => !open && setSelected(null)}
          facilityId={facilityId}
          member={selected.member}
          onLinked={refresh}
        />
      )}
      {selected?.mode === "create" && (
        <AbdmHprCreateSheet
          open
          onOpenChange={(open) => !open && setSelected(null)}
          facilityId={facilityId}
          member={selected.member}
          onLinked={refresh}
        />
      )}
    </Card>
  );
}
