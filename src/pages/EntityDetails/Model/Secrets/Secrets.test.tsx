import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";

import * as apiHooks from "juju/apiHooks";
import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import {
  configFactory,
  credentialFactory,
  generalStateFactory,
} from "testing/factories/general";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  modelListInfoFactory,
  secretsStateFactory,
  listSecretResultFactory,
  modelSecretsFactory,
  modelDataInfoFactory,
  modelFeaturesFactory,
  modelDataFactory,
  modelFeaturesStateFactory,
} from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";
import urls from "urls";

import Secrets, { Label } from "./Secrets";
import { TestId as SecretsTableTestId } from "./SecretsTable/SecretsTable";

const mockStore = configureStore<RootState, unknown>([]);

jest.mock("juju/apiHooks", () => {
  return {
    useGetSecretContent: jest.fn().mockReturnValue(jest.fn()),
    useListSecrets: jest.fn().mockReturnValue(jest.fn()),
  };
});

describe("Secrets", () => {
  let state: RootState;
  const path = urls.model.index(null);
  const url = urls.model.index({
    userName: "eggman@external",
    modelName: "test-model",
  });

  beforeEach(() => {
    jest.spyOn(apiHooks, "useListSecrets").mockImplementation(() => jest.fn());
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        credentials: {
          "wss://example.com/api": credentialFactory.build(),
        },
        config: configFactory.build({
          controllerAPIEndpoint: "wss://example.com/api",
        }),
        controllerConnections: {
          "wss://example.com/api": {
            user: {
              "display-name": "eggman",
              identity: "user-eggman@external",
              "controller-access": "",
              "model-access": "",
            },
          },
        },
      }),
      juju: {
        models: {
          abc123: modelListInfoFactory.build({
            wsControllerURL: "wss://example.com/api",
            uuid: "abc123",
          }),
        },
        secrets: secretsStateFactory.build({
          abc123: modelSecretsFactory.build({
            items: [listSecretResultFactory.build()],
            loaded: true,
          }),
        }),
      },
    });
  });

  it("displays errors", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        errors: "failed to load",
        loaded: true,
      }),
    });
    renderComponent(<Secrets />, { state, path, url });
    expect(
      document.querySelector(".p-notification--negative"),
    ).toHaveTextContent("failed to load");
  });

  it("displays a table of secrets", async () => {
    renderComponent(<Secrets />, { state, path, url });
    expect(
      screen.getByTestId(SecretsTableTestId.SECRETS_TABLE),
    ).toBeInTheDocument();
  });

  it("fetches secrets", async () => {
    const listSecrets = jest.fn();
    jest
      .spyOn(apiHooks, "useListSecrets")
      .mockImplementation(() => listSecrets);
    renderComponent(<Secrets />, { state, path, url });
    expect(listSecrets).toHaveBeenCalled();
  });

  it("cleans up secrets when unmounted", async () => {
    const store = mockStore(state);
    const { result } = renderComponent(<Secrets />, { store, path, url });
    result.unmount();
    const updateAction = jujuActions.clearSecrets({
      modelUUID: "abc123",
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === updateAction.type),
      ).toMatchObject(updateAction);
    });
  });

  it("handles no data when unmounting", async () => {
    const store = mockStore(rootStateFactory.build());
    const { result } = renderComponent(<Secrets />, { store, path, url });
    result.unmount();
    const updateAction = jujuActions.clearSecrets({
      modelUUID: "abc123",
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === updateAction.type),
      ).toBeUndefined();
    });
  });

  it("can open a panel to add a secret", async () => {
    state.juju.modelData = {
      abc123: modelDataFactory.build({
        info: modelDataInfoFactory.build({
          uuid: "abc123",
          name: "test-model",
          "controller-uuid": "controller123",
          users: [
            modelUserInfoFactory.build({
              user: "eggman@external",
              access: "admin",
            }),
          ],
        }),
      }),
    };
    state.juju.modelFeatures = modelFeaturesStateFactory.build({
      abc123: modelFeaturesFactory.build({
        manageSecrets: true,
      }),
    });
    renderComponent(<Secrets />, { state, path, url });
    expect(window.location.search).toEqual("");
    await userEvent.click(screen.getByRole("button", { name: Label.ADD }));
    expect(window.location.search).toEqual("?panel=add-secret");
  });

  it("does not display an add secret button if secrets can't be managed", async () => {
    state.juju.modelFeatures = modelFeaturesStateFactory.build({
      abc123: modelFeaturesFactory.build({
        manageSecrets: false,
      }),
    });
    renderComponent(<Secrets />, { state, path, url });
    expect(
      screen.queryByRole("button", { name: Label.ADD }),
    ).not.toBeInTheDocument();
  });
});
