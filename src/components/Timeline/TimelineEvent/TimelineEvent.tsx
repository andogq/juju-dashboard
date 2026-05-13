import { Icon } from "@canonical/react-components";
import classNames from "classnames";
import type { FC } from "react";

import RelativeDate from "components/RelativeDate";
import { testId } from "testing/utils";

import type { TimelineEvent as TimelineEventType } from "../types";
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
  const { type, detail } = event;
  switch (type) {
    case "status-change":
      if (detail.previousStatus && detail.newStatus) {
        return `${detail.previousStatus} \u2192 ${detail.newStatus}`;
      }
      return detail.newStatus ?? detail.message ?? "";
    case "relation-created":
    case "relation-removed":
      if (detail.relatedApp && detail.interface) {
        return `${detail.relatedApp} (${detail.interface})`;
      }
      return detail.message ?? "";
    case "scale-up":
    case "scale-down":
    case "planned-scaling":
      if (detail.unitCount) {
        return `${detail.unitCount} unit${detail.unitCount > 1 ? "s" : ""}`;
      }
      return detail.message ?? "";
    default:
      return detail.message ?? "";
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
