import { useQuery } from "@tanstack/react-query";
import { formatDistanceStrict } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import { AbdmExchange, ExchangeState } from "@/types/abdm/hip";
import hipApi from "@/types/abdm/hipApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

const STATE_VARIANT: Record<
  ExchangeState,
  "secondary" | "green" | "destructive" | "yellow" | "blue"
> = {
  sent: "secondary",
  accepted: "yellow",
  answered: "green",
  refused: "destructive",
  received: "yellow",
  replied: "green",
  rejected: "destructive",
};

function Headers({ headers }: { headers: Record<string, number> }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(headers).map(([name, length]) => (
        <Badge key={name} variant="outline" size="xs">
          {t("abdm_header_length", { name, length })}
        </Badge>
      ))}
    </div>
  );
}

function ExchangeLine({ exchange }: { exchange: AbdmExchange }) {
  const { t } = useTranslation();
  const Arrow = exchange.direction === "outbound" ? ArrowUpRight : ArrowDownLeft;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Arrow className="size-4 text-gray-500" aria-label={exchange.direction} />
        <span className="font-mono text-xs break-all">{exchange.path}</span>
        <Badge variant={STATE_VARIANT[exchange.state]} size="xs">
          {t(`abdm_exchange_state__${exchange.state}`)}
        </Badge>
        {exchange.http_status && (
          <span className="text-xs text-gray-600">{exchange.http_status}</span>
        )}
      </div>
      {(exchange.error_code || exchange.error_message) && (
        <span className="text-xs text-red-700">
          {[exchange.error_code, exchange.error_message].filter(Boolean).join(": ")}
        </span>
      )}
    </div>
  );
}

export default function AbdmExchangeLog() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ["abdm-exchanges", search],
    queryFn: query.debounced(hipApi.listExchanges, {
      queryParams: { search: search || undefined, limit: 100 },
    }),
    refetchInterval: 10_000,
  });

  return (
    <Page title={t("abdm_exchange_log")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">{t("abdm_exchange_log_description")}</p>
        <Input
          className="max-w-sm"
          placeholder={t("abdm_exchange_search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("abdm_exchange_when")}</TableHead>
              <TableHead>{t("abdm_exchange_call")}</TableHead>
              <TableHead>{t("abdm_exchange_answer")}</TableHead>
              <TableHead>{t("request_id")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>{t("loading")}</TableCell>
              </TableRow>
            )}
            {data?.results.map((exchange) => (
              <Fragment key={exchange.id}>
                <TableRow
                  className="cursor-pointer align-top"
                  onClick={() =>
                    setExpanded(expanded === exchange.id ? undefined : exchange.id)
                  }
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(exchange.created_date)}
                  </TableCell>
                  <TableCell>
                    <ExchangeLine exchange={exchange} />
                  </TableCell>
                  <TableCell>
                    {exchange.answered_by ? (
                      <div className="flex flex-col gap-1">
                        <ExchangeLine exchange={exchange.answered_by} />
                        <span className="text-xs text-gray-500">
                          {t("abdm_exchange_after", {
                            elapsed: formatDistanceStrict(
                              new Date(exchange.answered_by.created_date),
                              new Date(exchange.created_date),
                            ),
                          })}
                        </span>
                      </div>
                    ) : exchange.state === "accepted" ? (
                      <span className="text-xs text-gray-600">
                        {t("abdm_exchange_waiting", {
                          elapsed: formatDistanceStrict(
                            new Date(),
                            new Date(exchange.created_date),
                          ),
                        })}
                      </span>
                    ) : exchange.state === "received" ? (
                      <span className="text-xs text-red-700">
                        {t("abdm_exchange_unanswered")}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {exchange.request_id}
                  </TableCell>
                </TableRow>
                {expanded === exchange.id && (
                  <TableRow>
                    <TableCell colSpan={4} className="bg-gray-50">
                      <div className="flex flex-col gap-2">
                        <Headers headers={exchange.headers} />
                        {exchange.answered_by && (
                          <Headers headers={exchange.answered_by.headers} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </Page>
  );
}
