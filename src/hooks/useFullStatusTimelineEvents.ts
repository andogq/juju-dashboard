import { useEffect, useMemo } from "react";

import type { FullStatus } from "@canonical/jujulib/dist/api/facades/client/ClientV8";

import { getModelUUIDFromList } from "store/juju/selectors";
import { useAppSelector } from "store/store";

import { deriveEventsFromFullStatus } from "components/Timeline/deriveEventsFromFullStatus";
import type { TimelineEvent } from "components/Timeline/types";

const useFullStatusTimelineEvents = (
  modelName: null | string | undefined,
  qualifier: null | string | undefined,
): TimelineEvent[] => {
  const modelUUID = useAppSelector((state) =>
    getModelUUIDFromList(state, modelName, qualifier),
  );
  const modelData = useAppSelector((state) =>
    modelUUID ? state.juju.modelData[modelUUID] : undefined,
  );

  const events = useMemo(() => {
    if (!modelData) return [];
    return deriveEventsFromFullStatus(modelData as unknown as FullStatus);
  }, [modelData]);

  useEffect(() => {
    if (events.length > 0) {
      console.log("FullStatus timeline events:", events);
    }
  }, [events]);

  return events;
};

export default useFullStatusTimelineEvents;
