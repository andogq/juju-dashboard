import { ModelWatcherData } from "juju/types";

export type TSFixMe = any;

export type UIState = {
  confirmationModalActive: boolean;
  userMenuActive: boolean;
  sideNavCollapsed: boolean;
};

export type ReduxState = {
  root: TSFixMe;
  juju: {
    models: TSFixMe;
    modelData: TSFixMe;
    modelWatcherData: ModelWatcherData;
  };
  ui: UIState;
};
