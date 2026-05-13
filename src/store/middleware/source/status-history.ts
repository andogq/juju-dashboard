import type { TimelineEvent } from "components/Timeline/types";
import { createPollingSource } from "data/pollingSource";
import type { ConnectionWithFacades } from "juju/types";
import { actions as jujuActions } from "store/juju";
import { logger } from "utils/logger";

import { hasConnections } from "../connection/util";
import { createSourceMiddleware } from "../source-middleware";

export const NOT_AUTHENTICATED_ERROR = "not authenticated with controller";
export const NO_CLIENT_FACADE =
  "Client facade is not available on the connection";

function deriveSeverity(status: string): TimelineEvent["severity"] {
  switch (status) {
    case "active":
      return "success";
    case "blocked":
    case "error":
      return "error";
    case "maintenance":
    case "waiting":
      return "info";
    default:
      return "info";
  }
}

export async function getStatusHistory(
  modelConnection: ConnectionWithFacades,
): Promise<TimelineEvent[]> {
  if (!modelConnection.info.user?.identity) {
    throw new Error(NOT_AUTHENTICATED_ERROR);
  }
  if (!modelConnection.facades.client) {
    throw new Error(NO_CLIENT_FACADE);
  }

  const fullStatus = await modelConnection.facades.client.fullStatus({
    patterns: [],
    "include-storage": true,
  });

  const events: TimelineEvent[] = [];
  const applications = fullStatus?.applications ?? {};

  type RequestEntry = {
    tag: string;
    filter: { date: string; exclude: string[]; };
    historyKind: string;
  };
  const statusHistoryRequests: RequestEntry[] = [];
  const appNames: string[] = [];
  const unitEntries: { appName: string; unitName: string }[] = [];

  for (const [appName, appStatus] of Object.entries(applications)) {
    appNames.push(appName);
    statusHistoryRequests.push({
      tag: `application-${appName}`,
      filter: { date: "1970-01-01T00:00:00Z",  exclude: [] },
      historyKind: "application",
    });

    const units = appStatus.units ?? {};
    for (const unitName of Object.keys(units)) {
      unitEntries.push({ appName, unitName });
      statusHistoryRequests.push({
        tag: `unit-${unitName.replace("/", "-")}`,
        filter: { date: "1970-01-01T00:00:00Z",  exclude: []},
        historyKind: "unit",
      });
    }
  }

  if (statusHistoryRequests.length === 0) {
    return [];
  }

  const historyResults = await modelConnection.facades.client.statusHistory({
    requests: statusHistoryRequests,
  });

  let requestIndex = 0;

  for (const appName of appNames) {
    const result = historyResults.results[requestIndex];
    requestIndex++;

    if (result?.history?.statuses) {
      const {statuses} = result.history;
      for (let i = 1; i < statuses.length; i++) {
        const prev = statuses[i - 1];
        const curr = statuses[i];
        if (prev.status !== curr.status) {
          events.push({
            id: `status-history-app-${appName}-${curr.since}`,
            type: "status-change",
            timestamp: curr.since ?? new Date().toISOString(),
            entity: appName,
            entityKind: "application",
            payload: {
              type: "status-change",
              data: {
                previousStatus: prev.status,
                newStatus: curr.status,
                message: curr.info || undefined,
              },
            },
            severity: deriveSeverity(curr.status),
          });
        }
      }
    }

    const appUnits = unitEntries.filter((e) => e.appName === appName);
    for (const { unitName } of appUnits) {
      const result = historyResults.results[requestIndex];
      requestIndex++;

      if (result?.history?.statuses) {
        const {statuses} = result.history;
        for (let i = 1; i < statuses.length; i++) {
          const prev = statuses[i - 1];
          const curr = statuses[i];
          if (prev.status !== curr.status) {
            const eventType =
              curr.status === "error" ? "unit-error" : "status-change";
            events.push({
              id: `status-history-unit-${unitName}-${curr.since}`,
              type: eventType,
              timestamp: curr.since ?? new Date().toISOString(),
              entity: unitName,
              entityKind: "unit",
              payload:
                eventType === "unit-error"
                  ? {
                      type: "unit-error",
                      data: {
                        message: curr.info ?? "unit entered error state",
                      },
                    }
                  : {
                      type: "status-change",
                      data: {
                        previousStatus: prev.status,
                        newStatus: curr.status,
                        message: curr.info || undefined,
                      },
                    },
              severity: deriveSeverity(curr.status),
            });
          }
        }
      }
    }
  }

  return events;
}

export default createSourceMiddleware<
  TimelineEvent[],
  { wsControllerURL: string; modelURL: string }
>(
  "status-history",
  ({ wsControllerURL: _, modelURL, meta }) => {
    if (!hasConnections(meta, ["modelURL"])) {
      throw new Error("model connection not provided");
    }

    const modelConnection = meta.connections.modelURL;

    return createPollingSource(
      async () => getStatusHistory(modelConnection),
      { interval: { minutes: 5 } },
    );
  },
  {
    setData: ({ modelURL }, data) =>
      jujuActions.updateTimelineEvents({
        modelUUID: extractModelUUID(modelURL),
        update: { data },
      }),
    setError: ({ modelURL }, error) =>
      jujuActions.updateTimelineEvents({
        modelUUID: extractModelUUID(modelURL),
        update: { error },
      }),
    setLoading: ({ modelURL }, loading) =>
      jujuActions.updateTimelineEvents({
        modelUUID: extractModelUUID(modelURL),
        update: { loading },
      }),
  },
  {
    addActionMeta: (_payload) => ({
      withConnection: true,
      connectionList: ["modelURL"],
    }),
  },
);

function extractModelUUID(modelURL: string): string {
  const match = modelURL.match(/\/model\/([^/]+)\/api/);
  return match ? match[1] : modelURL;
}
