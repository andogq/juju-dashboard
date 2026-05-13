import { Spinner } from "@canonical/react-components";
import type { FC } from "react";

import { testId } from "testing/utils";

import TimelineEvent from "./TimelineEvent";
import CollapsibleEventGroup from "./TimelineEventGroup/TimelineEventGroup";
import { groupConsecutiveEvents } from "./groupEvents";
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
        new Date(eventA.timestamp).getTime() -
        new Date(eventB.timestamp).getTime(),
    );

  const futureEvents = events
    .filter((event) => event.isFuture)
    .sort(
      (eventA, eventB) =>
        new Date(eventA.timestamp).getTime() -
        new Date(eventB.timestamp).getTime(),
    );

  const pastItems = groupConsecutiveEvents(pastEvents);
  const futureItems = groupConsecutiveEvents(futureEvents);

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
        {pastItems.length > 0 && (
          <div className="timeline__section" {...testId(TestId.PAST_SECTION)}>
            <span className="timeline__section-label">
              {Label.PAST_EVENTS}
            </span>
            <div className="timeline__events">
              {pastItems.map((item) =>
                item.kind === "single" ? (
                  <TimelineEvent key={item.event.id} event={item.event} />
                ) : (
                  <CollapsibleEventGroup
                    key={item.group.id}
                    group={item.group}
                  />
                ),
              )}
            </div>
          </div>
        )}

        <div className="timeline__now" {...testId(TestId.NOW_MARKER)}>
          <div className="timeline__now-line" />
          <span className="timeline__now-label">{Label.NOW}</span>
        </div>

        {futureItems.length > 0 && (
          <div
            className="timeline__section timeline__section--future"
            {...testId(TestId.FUTURE_SECTION)}
          >
            <span className="timeline__section-label">
              {Label.FUTURE_EVENTS}
            </span>
            <div className="timeline__events">
              {futureItems.map((item) =>
                item.kind === "single" ? (
                  <TimelineEvent key={item.event.id} event={item.event} />
                ) : (
                  <CollapsibleEventGroup
                    key={item.group.id}
                    group={item.group}
                  />
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
