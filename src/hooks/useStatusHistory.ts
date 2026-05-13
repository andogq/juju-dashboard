import { useEffect } from "react";

import { getWSControllerURL } from "store/general/selectors";
import { getModelUUIDFromList } from "store/juju/selectors";
import statusHistory from "store/middleware/source/status-history";
import { useAppDispatch, useAppSelector } from "store/store";

const useStatusHistory = (
  modelName: null | string | undefined,
  qualifier: null | string | undefined,
  fetchData = true,
): void => {
  const dispatch = useAppDispatch();
  const wsControllerURL = useAppSelector(getWSControllerURL);
  const modelUUID = useAppSelector((state) =>
    getModelUUIDFromList(state, modelName, qualifier),
  );
  const timelineEvents = useAppSelector(
    (state) => state.juju.timelineEvents.data,
  );
  const timelineEventsError = useAppSelector(
    (state) => state.juju.timelineEvents.error,
  );

  useEffect(() => {
    if (timelineEvents) {
      console.log("Timeline events:", timelineEvents);
    }
  }, [timelineEvents]);
  useEffect(() => {
    if (timelineEventsError) {
      console.error("Timeline error:", timelineEventsError);
    }
  }, [timelineEventsError]);

  useEffect(() => {
    if (!fetchData || !wsControllerURL || !modelUUID) {
      return;
    }

    const modelURL = wsControllerURL.replace(
      "/api",
      `/model/${modelUUID}/api`,
    );

    dispatch(
      statusHistory.actions.start({
        wsControllerURL,
        modelURL,
      }),
    );

    return (): void => {
      dispatch(
        statusHistory.actions.stop({
          wsControllerURL,
          modelURL,
        }),
      );
    };
  }, [dispatch, fetchData, wsControllerURL, modelUUID]);
};

export default useStatusHistory;
