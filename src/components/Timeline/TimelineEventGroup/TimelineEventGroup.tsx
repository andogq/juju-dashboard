import { Icon } from "@canonical/react-components";
import classNames from "classnames";
import { useState, type FC } from "react";

import TimelineEvent from "components/Timeline/TimelineEvent/TimelineEvent";
import type { TimelineEventGroup as TimelineEventGroupType } from "components/Timeline/groupEvents";
import { testId } from "testing/utils";

import { TestId } from "../types";

type Props = {
  group: TimelineEventGroupType;
};

const CollapsibleEventGroup: FC<Props> = ({ group }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={classNames("timeline__event-group", {
        "timeline__event-group--expanded": expanded,
      })}
      {...testId(TestId.TIMELINE_EVENT)}
    >
      <TimelineEvent event={group.latest} />
      <button
        className="timeline__event-group-toggle p-button--base"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon
          name={expanded ? "collapse" : "show"}
          className="timeline__event-group-toggle-icon"
        />
        {expanded
          ? `Hide ${group.count - 1} similar event${group.count - 1 > 1 ? "s" : ""}`
          : `Show ${group.count - 1} more similar event${group.count - 1 > 1 ? "s" : ""}`}
      </button>
      {expanded && (
        <div className="timeline__event-group-collapsed">
          {group.collapsed.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsibleEventGroup;
