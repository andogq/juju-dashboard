import { Spinner } from "@canonical/react-components";
import type { FC } from "react";

import { testId } from "testing/utils";

import TimelineEvent from "./TimelineEvent";
import { Label, TestId, type TimelineProps } from "./types";

const Timeline: FC<TimelineProps> = ({
  events,
  loading = false,
  emptyStateMsg = "No events to display",
}) => {
  const pastEvents = events
    .filter((event) => !event.isFuture)
    .sort(
      (eventA, eventB) =>
        new Date(eventB.timestamp).getTime() -
        new Date(eventA.timestamp).getTime(),
    );

  const futureEvents = events
    .filter((event) => event.isFuture)
    .sort(
      (eventA, eventB) =>
        new Date(eventA.timestamp).getTime() -
        new Date(eventB.timestamp).getTime(),
    );

  if (loading) {
    return (
      <div className="timeline__loading" {...testId(TestId.TIMELINE)}>
        <Spinner text="Loading timeline..." />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="timeline__empty" {...testId(TestId.TIMELINE)}>
        <p>{emptyStateMsg}</p>
      </div>
    );
  }

  return (
    <div className="timeline" {...testId(TestId.TIMELINE)}>
      <div className="timeline__content">
        {pastEvents.length > 0 && (
          <div className="timeline__section" {...testId(TestId.PAST_SECTION)}>
            <span className="timeline__section-label">
              {Label.PAST_EVENTS}
            </span>
            <div className="timeline__events">
              {pastEvents.map((event) => (
                <TimelineEvent key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div className="timeline__now" {...testId(TestId.NOW_MARKER)}>
          <div className="timeline__now-line" />
          <span className="timeline__now-label">{Label.NOW}</span>
        </div>

        {futureEvents.length > 0 && (
          <div
            className="timeline__section timeline__section--future"
            {...testId(TestId.FUTURE_SECTION)}
          >
            <span className="timeline__section-label">
              {Label.FUTURE_EVENTS}
            </span>
            <div className="timeline__events">
              {futureEvents.map((event) => (
                <TimelineEvent key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
