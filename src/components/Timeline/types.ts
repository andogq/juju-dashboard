export type TimelineEventType =
  // Status events (from statusHistory or polling diff)
  | "planned-deployment"
  | "planned-maintenance"
  | "planned-scaling"
  // Relation events (from polling diff)
  | "relation-created"
  | "relation-removed"
  // Scale events (from polling diff)
  | "scale-down"
  | "scale-up"
  // Future/planned events (from external sources)
  | "status-change"
  | "unit-error"
  | "unit-resolved";

export type TimelineEventSeverity = "error" | "info" | "success" | "warning";

// -- Payloads --

export interface StatusChangePayload {
  previousStatus: string;
  newStatus: string;
  message?: string;
}

export interface UnitErrorPayload {
  message: string;
}

export interface UnitResolvedPayload {
  message?: string;
}

export interface RelationEventPayload {
  interface: string;
}

export interface ScaleEventPayload {
  unitCount: number;
  previousCount?: number;
}

export interface PlannedDeploymentPayload {
  charmName?: string;
  channel?: string;
  message?: string;
}

export interface PlannedMaintenancePayload {
  message: string;
  endTime?: string;
}

export interface PlannedScalingPayload {
  targetCount: number;
  message?: string;
}

export type EventPayload =
  | { type: "planned-deployment"; data: PlannedDeploymentPayload }
  | { type: "planned-maintenance"; data: PlannedMaintenancePayload }
  | { type: "planned-scaling"; data: PlannedScalingPayload }
  | { type: "relation-created"; data: RelationEventPayload }
  | { type: "relation-removed"; data: RelationEventPayload }
  | { type: "scale-down"; data: ScaleEventPayload }
  | { type: "scale-up"; data: ScaleEventPayload }
  | { type: "status-change"; data: StatusChangePayload }
  | { type: "unit-error"; data: UnitErrorPayload }
  | { type: "unit-resolved"; data: UnitResolvedPayload };

// -- Core event --

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  entity: string;
  entityKind: "application" | "model" | "relation" | "unit";
  payload: EventPayload;
  severity: TimelineEventSeverity;
  isFuture?: boolean;
  metadata?: Record<string, unknown>;
}

// -- Component props --

export interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  emptyStateMsg?: string;
}

export interface TimelineEventComponentProps {
  event: TimelineEvent;
}

export enum Label {
  PAST_EVENTS = "Past Events",
  FUTURE_EVENTS = "Planned Events",
  NOW = "Now",
}

export enum TestId {
  TIMELINE = "timeline",
  TIMELINE_EVENT = "timeline-event",
  NOW_MARKER = "now-marker",
  PAST_SECTION = "past-section",
  FUTURE_SECTION = "future-section",
}

export type TimelineEventType =
  | "planned-deployment"
  | "planned-maintenance"
  | "planned-scaling"
  | "relation-created"
  | "relation-removed"
  | "scale-down"
  | "scale-up"
  | "status-change"
  | "unit-error"
  | "unit-resolved";

export type TimelineEventSeverity = "error" | "info" | "success" | "warning";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  timestamp: string; // ISO 8601
  entity: string;
  entityKind: "application" | "relation" | "unit";
  detail: {
    previousStatus?: string;
    newStatus?: string;
    message?: string;
    relatedApp?: string;
    interface?: string;
    unitCount?: number;
  };
  severity: TimelineEventSeverity;
  isFuture?: boolean;
};

export type TimelineProps = {
  events: TimelineEvent[];
  loading?: boolean;
  emptyStateMsg?: string;
};
