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
