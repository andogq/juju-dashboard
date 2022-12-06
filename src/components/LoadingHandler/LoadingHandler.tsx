import { ReactNode } from "react";
import { Spinner } from "@canonical/react-components";

import "./_loading-handler.scss";

export enum TestId {
  LOADING = "loading",
}

type LoadingHandlerProps = {
  children?: ReactNode;
  hasData: boolean;
  noDataMessage: string;
  loading: boolean;
};

export default function LoadingHandler({
  hasData,
  noDataMessage,
  loading,
  children,
}: LoadingHandlerProps): JSX.Element {
  const generateContent = () => {
    if (!hasData) {
      if (loading) {
        return (
          <div className="loading-handler__spinner">
            <div className="loading-handler__spinner-content">
              <Spinner data-testid={TestId.LOADING} />
            </div>
          </div>
        );
      } else {
        return noDataMessage;
      }
    } else {
      return children;
    }
  };

  return <div className="loading-handler">{generateContent()}</div>;
}
