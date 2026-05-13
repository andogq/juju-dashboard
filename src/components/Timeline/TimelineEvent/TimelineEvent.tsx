import { Icon } from "@canonical/react-components";
import classNames from "classnames";
import type { FC } from "react";

import RelativeDate from "components/RelativeDate";
import { testId } from "testing/utils";

import type {
  StatusChangePayload,
  TimelineEvent as TimelineEventType,
  RelationEventPayload,
  ScaleEventPayload,
  PlannedScalingPayload,
} from "../types";
import { TestId } from "../types";

type Props = {
  event: TimelineEventType;
};

const eventTypeLabels: Record<TimelineEventType["type"], string> = {
  "status-change": "Status changed",
  "relation-created": "Relation created",
  "relation-removed": "Relation removed",
  "scale-up": "Scaled up",
  "scale-down": "Scaled down",
  "unit-error": "Unit error",
  "unit-resolved": "Unit resolved",
  "planned-deployment": "Planned deployment",
  "planned-maintenance": "Planned maintenance",
  "planned-scaling": "Planned scaling",
};

const getDetailMessage = (event: TimelineEventType): string => {
  const data = event.payload.data;
  switch (event.type) {
    case "status-change": {
      const d = data as StatusChangePayload;
      if (d.previousStatus && d.newStatus) {
        return `${d.previousStatus} \u2192 ${d.newStatus}`;
      }
      return d.newStatus ?? d.message ?? "";
    }
    case "relation-created":
    case "relation-removed": {
      const d = data as RelationEventPayload;
      if (d.interface) {
        return d.interface;
      }
      return (data as { message?: string }).message ?? "";
    }
    case "scale-up":
    case "scale-down":
    case "planned-scaling": {
      const d = data as ScaleEventPayload | PlannedScalingPayload;
      const unitCount = "unitCount" in d ? d.unitCount : d.targetCount;
      if (unitCount) {
        return `${unitCount} unit${unitCount > 1 ? "s" : ""}`;
      }
      return (data as { message?: string }).message ?? "";
    }
    default:
      return (data as { message?: string }).message ?? "";
  }
};

const severityIconMap: Record<TimelineEventType["severity"], string> = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "information",
};

const TimelineEvent: FC<Props> = ({ event }) => {
  return (
    <div
      className={classNames("timeline__event", {
        "timeline__event--future": event.isFuture,
        [`timeline__event--${event.severity}`]: true,
      })}
      {...testId(TestId.TIMELINE_EVENT)}
    >
      <div className="timeline__event-marker">
        <Icon
          className="timeline__event-dot"
          name={severityIconMap[event.severity]}
        />
      </div>
      <div className="timeline__event-content">
        <div className="timeline__event-header">
          <span className="timeline__event-type">
            {eventTypeLabels[event.type]}
          </span>
          <span className="timeline__event-entity">{event.entity}</span>
          <span className="timeline__event-time">
            <RelativeDate datetime={event.timestamp} />
          </span>
        </div>
        <div className="timeline__event-detail">{getDetailMessage(event)}</div>
      </div>
    </div>
  );
};

export default TimelineEvent;
