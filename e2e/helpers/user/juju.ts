import type { Page } from "@playwright/test";

import { exec } from "utils/exec";

import type { GrantPermissionForObject, JujuObject, User, UserKind } from ".";
import {
  JujuObjectType,
  Action,
  ApplicationOfferGrantPermission,
  ControllerGrantPermission,
  ModelGrantPermission,
} from ".";
import { UserImplementation } from ".";

/**
 * An implementation for users which are stored and managed completely within Juju.
 */
export class Juju extends UserImplementation {
  async login(page: Page, user: User) {
    await page.goto("/");
    await page.getByRole("textbox", { name: "Username" }).fill(user.username);
    await page.getByRole("textbox", { name: "Password" }).fill(user.password);
    await page.getByRole("button", { name: "Log in to the dashboard" }).click();
  }

  getUser(userKind: UserKind, id: number): Promise<User> {
    throw new Error("Method not implemented.");
  }

  grant<O extends JujuObjectType>(
    username: string,
    object: JujuObject<O>,
    permission: GrantPermissionForObject<O>,
  ): Action {
    return new JujuGrant(
      username,
      Juju.permissionToAccessLevel(object.type, permission),
      object,
    );
  }

  /**
   * Convert the generic `GrantPermission` into the Juju-specific `AccessLevel`.
   */
  private static permissionToAccessLevel<O extends JujuObjectType>(
    object: O,
    permission: GrantPermissionForObject<O>,
  ): AccessLevelForObject<O> {
    return GRANT_PERMISSION_TO_ACCESS_LEVEL[object][
      permission
    ] as unknown as AccessLevelForObject<O>;
  }
}

/**
 * An action to grant a user access to an object with the provided permission. Uses `juju grant`
 * internally.
 */
class JujuGrant<O extends JujuObjectType> extends Action {
  private objects: JujuObject<O>[];

  constructor(
    private username: string,
    private permission: AccessLevelForObject<O>,
    ...objects: JujuObject<O>[]
  ) {
    super();
    this.objects = objects;
  }

  async run() {
    await exec(
      `juju grant '${this.username}' '${this.permission}' ${this.getObjects()}`,
    );
  }

  async rollback() {
    await exec(
      `juju revoke '${this.username}' '${this.permission}' ${this.getObjects()}`,
    );
  }

  private getObjects() {
    return this.objects.map((o) => `'${o}'`).join(" ");
  }
}

export enum ModelAccessLevel {
  Read = "read",
  Write = "write",
  Admin = "admin",
}

export enum ControllerAccessLevel {
  Login = "login",
  SuperUser = "superuser",
}

export enum ApplicationOfferAccessLevel {
  Read = "read",
  Consume = "consume",
  Admin = "admin",
}

type ObjectAccessMap = {
  [JujuObjectType.Model]: ModelAccessLevel;
  [JujuObjectType.Controller]: ControllerAccessLevel;
  [JujuObjectType.ApplicationOffer]: ApplicationOfferAccessLevel;
};

type AccessLevelForObject<O extends JujuObjectType> = ObjectAccessMap[O];

/**
 * Map of generic `GrantPermission`s to Juju specific `AccessLevel`s.
 */
const GRANT_PERMISSION_TO_ACCESS_LEVEL: {
  [O in JujuObjectType]: {
    [K in GrantPermissionForObject<O>]: AccessLevelForObject<O>;
  };
} = {
  [JujuObjectType.Model]: {
    [ModelGrantPermission.Read]: ModelAccessLevel.Read,
    [ModelGrantPermission.Write]: ModelAccessLevel.Write,
    [ModelGrantPermission.Admin]: ModelAccessLevel.Admin,
  },
  [JujuObjectType.Controller]: {
    [ControllerGrantPermission.Login]: ControllerAccessLevel.Login,
    [ControllerGrantPermission.Administrator]: ControllerAccessLevel.SuperUser,
  },
  [JujuObjectType.ApplicationOffer]: {
    [ApplicationOfferGrantPermission.Read]: ApplicationOfferAccessLevel.Read,
    [ApplicationOfferGrantPermission.Write]:
      ApplicationOfferAccessLevel.Consume,
    [ApplicationOfferGrantPermission.Admin]: ApplicationOfferAccessLevel.Admin,
  },
};
