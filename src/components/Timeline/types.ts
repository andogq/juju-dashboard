export type TimelineEventType =
  // Status events (from statusHistory or polling diff)
  | "status-change"
  | "unit-error"
  | "unit-resolved"
  // Relation events (from polling diff)
  | "relation-created"
  | "relation-removed"
  // Scale events (from polling diff)
  | "scale-up"
  | "scale-down"
  // Future/planned events (from external sources)
  | "planned-deployment"
  | "planned-maintenance"
  | "planned-scaling";

export type TimelineEventSeverity = "info" | "warning" | "error" | "success";

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
  | { type: "status-change"; data: StatusChangePayload }
  | { type: "unit-error"; data: UnitErrorPayload }
  | { type: "unit-resolved"; data: UnitResolvedPayload }
  | { type: "relation-created"; data: RelationEventPayload }
  | { type: "relation-removed"; data: RelationEventPayload }
  | { type: "scale-up"; data: ScaleEventPayload }
  | { type: "scale-down"; data: ScaleEventPayload }
  | { type: "planned-deployment"; data: PlannedDeploymentPayload }
  | { type: "planned-maintenance"; data: PlannedMaintenancePayload }
  | { type: "planned-scaling"; data: PlannedScalingPayload };

// -- Core event --

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  entity: string;
  entityKind: "application" | "unit" | "relation" | "model";
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
