import type {
  ApplicationStatus,
  EndpointStatus,
  FullStatus,
  RelationStatus,
  UnitStatus,
} from "@canonical/jujulib/dist/api/facades/client/ClientV8";

import type { TimelineEvent } from "components/Timeline/types";

type FullStatusWithUUID = FullStatus & { uuid?: string };

let eventCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${++eventCounter}-${Date.now()}`;
}

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

function diffApplicationStatus(
  appName: string,
  prevApp: ApplicationStatus,
  currApp: ApplicationStatus,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const prevAppStatus = prevApp["status"].status;
  const currAppStatus = currApp["status"].status;

  if (prevAppStatus !== currAppStatus) {
    events.push({
      id: generateId("app-status"),
      type: "status-change",
      timestamp: currApp["status"].since ?? new Date().toISOString(),
      entity: appName,
      entityKind: "application",
      payload: {
        type: "status-change",
        data: {
          previousStatus: prevAppStatus,
          newStatus: currAppStatus,
          message: currApp["status"].info || undefined,
        },
      },
      severity: deriveSeverity(currAppStatus),
    });
  }

  const prevUnitCount = getUnitCount(prevApp);
  const currUnitCount = getUnitCount(currApp);

  if (currUnitCount > prevUnitCount) {
    events.push({
      id: generateId("scale-up"),
      type: "scale-up",
      timestamp: new Date().toISOString(),
      entity: appName,
      entityKind: "application",
      payload: {
        type: "scale-up",
        data: {
          unitCount: currUnitCount,
          previousCount: prevUnitCount,
        },
      },
      severity: "info",
    });
  } else if (currUnitCount < prevUnitCount) {
    events.push({
      id: generateId("scale-down"),
      type: "scale-down",
      timestamp: new Date().toISOString(),
      entity: appName,
      entityKind: "application",
      payload: {
        type: "scale-down",
        data: {
          unitCount: currUnitCount,
          previousCount: prevUnitCount,
        },
      },
      severity: "warning",
    });
  }

  return events;
}

function diffUnitStatus(
  appName: string,
  unitName: string,
  prevUnit: UnitStatus,
  currUnit: UnitStatus,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const prevWorkloadStatus = prevUnit["workload-status"]?.status;
  const currWorkloadStatus = currUnit["workload-status"]?.status;

  if (prevWorkloadStatus && currWorkloadStatus && prevWorkloadStatus !== currWorkloadStatus) {
    if (currWorkloadStatus === "error") {
      events.push({
        id: generateId("unit-error"),
        type: "unit-error",
        timestamp: currUnit["workload-status"]?.since ?? new Date().toISOString(),
        entity: unitName,
        entityKind: "unit",
        payload: {
          type: "unit-error",
          data: {
            message:
              currUnit["workload-status"]?.info ?? "unit entered error state",
          },
        },
        severity: "error",
      });
    } else if (
      prevWorkloadStatus === "error" &&
      currWorkloadStatus !== "error"
    ) {
      events.push({
        id: generateId("unit-resolved"),
        type: "unit-resolved",
        timestamp: currUnit["workload-status"]?.since ?? new Date().toISOString(),
        entity: unitName,
        entityKind: "unit",
        payload: {
          type: "unit-resolved",
          data: {
            message: `unit resolved: ${currWorkloadStatus}`,
          },
        },
        severity: "success",
      });
    }
  }

  return events;
}

function getRelationEntity(relation: RelationStatus): string {
  const endpoints = relation.endpoints ?? [];
  return endpoints
    .map((ep: EndpointStatus) => `${ep.application}:${ep.name}`)
    .join(" → ");
}

function diffRelations(
  prevRelations: RelationStatus[],
  currRelations: RelationStatus[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const prevIds = new Set(prevRelations.map((r) => r.id));
  const currIds = new Set(currRelations.map((r) => r.id));

  const prevById = new Map(prevRelations.map((r) => [r.id, r]));
  const currById = new Map(currRelations.map((r) => [r.id, r]));

  for (const id of currIds) {
    if (!prevIds.has(id)) {
      const relation = currById.get(id)!;
      events.push({
        id: generateId("relation-created"),
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
      });
    }
  }

  for (const id of prevIds) {
    if (!currIds.has(id)) {
      const relation = prevById.get(id)!;
      events.push({
        id: generateId("relation-removed"),
        type: "relation-removed",
        timestamp: new Date().toISOString(),
        entity: getRelationEntity(relation),
        entityKind: "relation",
        payload: {
          type: "relation-removed",
          data: {
            interface: relation.interface ?? "",
          },
        },
        severity: "warning",
      });
    }
  }

  return events;
}

function diffUnits(
  appName: string,
  prevUnits: Record<string, UnitStatus>,
  currUnits: Record<string, UnitStatus>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const currUnitNames = new Set(Object.keys(currUnits));

  for (const unitName of currUnitNames) {
    const prevUnit = prevUnits[unitName];
    const currUnit = currUnits[unitName];

    if (prevUnit) {
      events.push(...diffUnitStatus(appName, unitName, prevUnit, currUnit));
    }
  }

  return events;
}

export function diffFullStatus(
  prevStatus: FullStatusWithUUID | null,
  currStatus: FullStatusWithUUID | null,
): TimelineEvent[] {
  if (!prevStatus || !currStatus) {
    return [];
  }

  const events: TimelineEvent[] = [];

  const prevApps = prevStatus.applications ?? {};
  const currApps = currStatus.applications ?? {};
  const currAppNames = new Set(Object.keys(currApps));

  for (const appName of currAppNames) {
    const currApp = currApps[appName];
    const prevApp = prevApps[appName];

    if (prevApp) {
      events.push(...diffApplicationStatus(appName, prevApp, currApp));

      const prevUnits = prevApp.units ?? {};
      const currUnits = currApp.units ?? {};
      events.push(...diffUnits(appName, prevUnits, currUnits));
    }
  }

  events.push(
    ...diffRelations(
      prevStatus.relations ?? [],
      currStatus.relations ?? [],
    ),
  );

  return events;
}

export function resetEventCounter(): void {
  eventCounter = 0;
}
