import type { TimelineEvent } from "components/Timeline/types";

export type TimelineEventGroup = {
  id: string;
  latest: TimelineEvent;
  collapsed: TimelineEvent[];
  count: number;
};

export type TimelineDisplayItem =
  | { kind: "single"; event: TimelineEvent }
  | { kind: "group"; group: TimelineEventGroup };

export function groupConsecutiveEvents(
  events: TimelineEvent[],
): TimelineDisplayItem[] {
  if (events.length === 0) return [];

  const items: TimelineDisplayItem[] = [];
  let i = 0;

  while (i < events.length) {
    const current = events[i];
    const group: TimelineEvent[] = [current];

    let j = i + 1;
    while (
      j < events.length &&
      events[j].type === current.type &&
      events[j].entity === current.entity
    ) {
      group.push(events[j]);
      j++;
    }

    if (group.length === 1) {
      items.push({ kind: "single", event: current });
    } else {
      items.push({
        kind: "group",
        group: {
          id: `group-${current.type}-${current.entity}-${i}`,
          latest: current,
          collapsed: group.slice(1),
          count: group.length,
        },
      });
    }

    i = j;
  }

  return items;
}
