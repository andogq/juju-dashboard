import type {
  ApplicationStatus,
  EndpointStatus,
  FullStatus,
  RelationStatus,
  UnitStatus,
} from "@canonical/jujulib/dist/api/facades/client/ClientV8";

import type { TimelineEvent } from "components/Timeline/types";

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

function getUnitCount(appStatus: ApplicationStatus): number {
  return Object.keys(appStatus.units ?? {}).length;
}

function getRelationEntity(relation: RelationStatus): string {
  const endpoints = relation.endpoints ?? [];
  return endpoints
    .map((ep: EndpointStatus) => `${ep.application}:${ep.name}`)
    .join(" → ");
}

function deriveAppEvents(
  appName: string,
  appStatus: ApplicationStatus,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const appStatusInfo = appStatus["status"];

  events.push({
    id: `app-status-${appName}`,
    type: "status-change",
    timestamp: appStatusInfo.since ?? new Date().toISOString(),
    entity: appName,
    entityKind: "application",
    payload: {
      type: "status-change",
      data: {
        previousStatus: "",
        newStatus: appStatusInfo.status,
        message: appStatusInfo.info || undefined,
      },
    },
    severity: deriveSeverity(appStatusInfo.status),
  });

  const unitCount = getUnitCount(appStatus);
  if (unitCount > 0) {
    events.push({
      id: `app-scale-${appName}`,
      type: "scale-up",
      timestamp: appStatusInfo.since ?? new Date().toISOString(),
      entity: appName,
      entityKind: "application",
      payload: {
        type: "scale-up",
        data: {
          unitCount,
        },
      },
      severity: "info",
    });
  }

  return events;
}

function deriveUnitEvents(
  unitName: string,
  unitStatus: UnitStatus,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const workloadStatus = unitStatus["workload-status"];

  if (workloadStatus) {
    const eventType =
      workloadStatus.status === "error" ? "unit-error" : "status-change";

    events.push({
      id: `unit-${workloadStatus.status}-${unitName}`,
      type: eventType,
      timestamp: workloadStatus.since ?? new Date().toISOString(),
      entity: unitName,
      entityKind: "unit",
      payload:
        eventType === "unit-error"
          ? {
              type: "unit-error",
              data: {
                message: workloadStatus.info ?? "unit in error state",
              },
            }
          : {
              type: "status-change",
              data: {
                previousStatus: "",
                newStatus: workloadStatus.status,
                message: workloadStatus.info || undefined,
              },
            },
      severity: deriveSeverity(workloadStatus.status),
    });
  }

  const agentStatus = unitStatus["agent-status"];
  if (agentStatus && agentStatus.status !== workloadStatus?.status) {
    events.push({
      id: `unit-agent-${unitName}`,
      type: "status-change",
      timestamp: agentStatus.since ?? new Date().toISOString(),
      entity: unitName,
      entityKind: "unit",
      payload: {
        type: "status-change",
        data: {
          previousStatus: "",
          newStatus: agentStatus.status,
          message: agentStatus.info || undefined,
        },
      },
      severity: deriveSeverity(agentStatus.status),
    });
  }

  return events;
}

function deriveRelationEvents(
  relations: RelationStatus[],
): TimelineEvent[] {
  return relations.map((relation) => ({
    id: `relation-${relation.id}`,
    type: "relation-created",
    timestamp: new Date().toISOString(),
    entity: getRelationEntity(relation),
    entityKind: "relation",
    payload: {
      type: "relation-created",
      data: {
        interface: relation.interface ?? "",
      },
    },
    severity: "success",
  }));
}

export function deriveEventsFromFullStatus(
  fullStatus: FullStatus | null | undefined,
): TimelineEvent[] {
  if (!fullStatus) {
    return [];
  }

  const events: TimelineEvent[] = [];
  const applications = fullStatus.applications ?? {};

  for (const [appName, appStatus] of Object.entries(applications)) {
    events.push(...deriveAppEvents(appName, appStatus));

    const units = appStatus.units ?? {};
    for (const [unitName, unitStatus] of Object.entries(units)) {
      events.push(...deriveUnitEvents(unitName, unitStatus));
    }
  }

  const relations = fullStatus.relations ?? [];
  events.push(...deriveRelationEvents(relations));

  return events.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
