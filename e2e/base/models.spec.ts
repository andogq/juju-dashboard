import { expect } from "@playwright/test";

import { test } from "../fixtures/setup";
import { AddModel, AddSharedModel } from "../helpers/juju-helpers";

test.beforeAll(async ({ runActions }) => {
  await runActions([
    new AddModel("foo"),
    new AddSharedModel("John-Doe", "bar"),
  ]);
  // TODO: Handle auth
  // await jujuHelpers.jujuLogin();
  // await jujuHelpers.adminLogin();
});

test("List created and shared models", async ({ page, authHelpers }) => {
  await authHelpers.login();

  await expect(
    page
      .locator("tr", { hasText: "foo" })
      .and(page.locator("tr", { hasText: "admin" })),
  ).toBeInViewport();
  await expect(
    page
      .locator("tr", { hasText: "bar" })
      .and(page.locator("tr", { hasText: "John-Doe" })),
  ).toBeInViewport();
});
