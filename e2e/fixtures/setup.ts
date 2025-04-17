/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";

import { runActions, type Action } from "../helpers/action";
import { AuthHelpers } from "../helpers/auth-helpers";
import { JujuHelpers } from "../helpers/juju-helpers";

type Fixtures = {
  authHelpers: AuthHelpers;
  jujuHelpers: JujuHelpers;
  runActions: (actions: Action<unknown>[]) => Promise<void>;
};

export enum CloudAccessType {
  ADD_MODEL = "add-model",
}

export enum ModelAccessTypes {
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
}

export enum ResourceType {
  MODEL = "MODEL",
  USER = "USER",
  CLOUD = "CLOUD",
}

export type Resource = {
  resourceName: string | CloudAccessType;
  type: ResourceType;
  owner?: string;
};

const cleanupStack: Resource[] = [];

export const test = base.extend<Fixtures>({
  authHelpers: async ({ page }, use) => {
    await use(new AuthHelpers(page));
  },
  // eslint-disable-next-line no-empty-pattern
  jujuHelpers: async ({}, use) => {
    await use(new JujuHelpers(cleanupStack));
  },
  runActions: async (_, use) => {
    let cleanup: (() => Promise<void>) | null = null;

    await use(async (actions) => {
      cleanup = await runActions(actions);
    });

    if (cleanup !== null) {
      await (cleanup as () => Promise<void>)();
    }
  },
});

export default test;
