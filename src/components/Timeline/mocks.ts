import type { TimelineEvent } from "./types";

const now = new Date();

const pastDate = (minutesAgo: number): string => {
  return new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();
};

const futureDate = (minutesFromNow: number): string => {
  return new Date(now.getTime() + minutesFromNow * 60 * 1000).toISOString();
};

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "1",
    type: "status-change",
    timestamp: pastDate(5),
    entity: "mysql",
    entityKind: "application",
    detail: {
      previousStatus: "maintenance",
      newStatus: "active",
    },
    severity: "success",
  },
  {
    id: "2",
    type: "unit-error",
    timestamp: pastDate(15),
    entity: "mysql/0",
    entityKind: "unit",
    detail: {
      message: "disk space critical",
    },
    severity: "error",
  },
  {
    id: "3",
    type: "relation-created",
    timestamp: pastDate(30),
    entity: "mysql:db \u2192 wordpress:db",
    entityKind: "relation",
    detail: {
      relatedApp: "wordpress",
      interface: "db",
    },
    severity: "success",
  },
  {
    id: "4",
    type: "scale-up",
    timestamp: pastDate(45),
    entity: "mysql",
    entityKind: "application",
    detail: {
      unitCount: 3,
    },
    severity: "info",
  },
  {
    id: "5",
    type: "unit-resolved",
    timestamp: pastDate(60),
    entity: "mysql/0",
    entityKind: "unit",
    detail: {
      message: "unit recovered successfully",
    },
    severity: "success",
  },
  {
    id: "6",
    type: "status-change",
    timestamp: pastDate(120),
    entity: "wordpress",
    entityKind: "application",
    detail: {
      previousStatus: "waiting",
      newStatus: "active",
    },
    severity: "success",
  },
  {
    id: "7",
    type: "relation-removed",
    timestamp: pastDate(180),
    entity: "mysql:db \u2192 redis:cache",
    entityKind: "relation",
    detail: {
      relatedApp: "redis",
      interface: "db",
    },
    severity: "warning",
  },
  {
    id: "8",
    type: "scale-down",
    timestamp: pastDate(240),
    entity: "wordpress",
    entityKind: "application",
    detail: {
      unitCount: 1,
    },
    severity: "warning",
  },
  {
    id: "9",
    type: "status-change",
    timestamp: pastDate(360),
    entity: "mysql",
    entityKind: "application",
    detail: {
      previousStatus: "unknown",
      newStatus: "maintenance",
    },
    severity: "info",
  },
  {
    id: "10",
    type: "unit-error",
    timestamp: pastDate(480),
    entity: "wordpress/1",
    entityKind: "unit",
    detail: {
      message: "hook failed: install",
    },
    severity: "error",
  },
  {
    id: "11",
    type: "relation-created",
    timestamp: pastDate(720),
    entity: "wordpress:cache \u2192 redis:cache",
    entityKind: "relation",
    detail: {
      relatedApp: "redis",
      interface: "cache",
    },
    severity: "success",
  },
  {
    id: "12",
    type: "status-change",
    timestamp: pastDate(1440),
    entity: "wordpress",
    entityKind: "application",
    detail: {
      previousStatus: "unknown",
      newStatus: "waiting",
    },
    severity: "info",
  },
  {
    id: "13",
    type: "planned-deployment",
    timestamp: futureDate(30),
    entity: "postgresql",
    entityKind: "application",
    detail: {
      message: "scheduled deployment of postgresql charm",
    },
    severity: "info",
    isFuture: true,
  },
  {
    id: "14",
    type: "planned-scaling",
    timestamp: futureDate(120),
    entity: "mysql",
    entityKind: "application",
    detail: {
      unitCount: 5,
      message: "planned scale-up for traffic spike",
    },
    severity: "info",
    isFuture: true,
  },
  {
    id: "15",
    type: "planned-maintenance",
    timestamp: futureDate(1440),
    entity: "mysql",
    entityKind: "application",
    detail: {
      message: "scheduled maintenance window",
    },
    severity: "warning",
    isFuture: true,
  },
  {
    id: "16",
    type: "planned-scaling",
    timestamp: futureDate(2880),
    entity: "wordpress",
    entityKind: "application",
    detail: {
      unitCount: 5,
      message: "planned scale-up for traffic spike",
    },
    severity: "info",
    isFuture: true,
  },
  {
    id: "17",
    type: "planned-deployment",
    timestamp: futureDate(4320),
    entity: "redis",
    entityKind: "application",
    detail: {
      message: "scheduled deployment of redis charm v2",
    },
    severity: "info",
    isFuture: true,
  },
  {
    id: "18",
    type: "planned-maintenance",
    timestamp: futureDate(10080),
    entity: "wordpress",
    entityKind: "application",
    detail: {
      message: "scheduled security patching window",
    },
    severity: "warning",
    isFuture: true,
  },
];
