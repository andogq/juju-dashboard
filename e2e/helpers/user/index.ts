import type { Page } from "@playwright/test";

import { Juju } from "./juju";

/**
 * An action is a reversible side-effect executed within the test environment. Action
 * implementations are free to capture any required state as member properties, and use them for
 * execution in the `run` and `rollback` methods.
 */
export abstract class Action<T = void> {
  /**
   * Perform the action. The returned value will be provided to the `rollback` method when it's
   * called.
   */
  abstract run(): Promise<T>;

  /**
   * Rollback this action, using the provided state from when the action was run.
   */
  abstract rollback(state: T): Promise<void>;
}

/**
 * A type of object within Juju/JAAS.
 */
export enum JujuObjectType {
  Model,
  Controller,
  ApplicationOffer,
}

/**
 * A specific object, including it's type and an identifier.
 */
export class JujuObject<O extends JujuObjectType> {
  constructor(
    public type: O,
    public identifier: string,
  ) {}

  static Model(name: string): JujuObject<JujuObjectType.Model> {
    return new JujuObject(JujuObjectType.Model, name);
  }

  static Controller(name: string): JujuObject<JujuObjectType.Controller> {
    return new JujuObject(JujuObjectType.Controller, name);
  }

  static ApplicationOffer(
    offerUrl: string,
  ): JujuObject<JujuObjectType.ApplicationOffer> {
    return new JujuObject(JujuObjectType.ApplicationOffer, offerUrl);
  }
}

/**
 * Permissions that may be granted on a model.
 *
 * @note These permissions are analogous to permissions exposed to a user, rather than a specific
 * Juju/JAAS permisison.
 */
export enum ModelGrantPermission {
  Read,
  Write,
  Admin,
}

/**
 * Permissions that may be granted on a controller.
 *
 * @note These permissions are analogous to permissions exposed to a user, rather than a specific
 * Juju/JAAS permisison.
 */
export enum ControllerGrantPermission {
  Login,
  Administrator,
}

/**
 * Permissions that may be granted on an application offer.
 *
 * @note These permissions are analogous to permissions exposed to a user, rather than a specific
 * Juju/JAAS permisison.
 */
export enum ApplicationOfferGrantPermission {
  Read,
  Write,
  Admin,
}

type ObjectPermissionMap = {
  [JujuObjectType.Model]: ModelGrantPermission;
  [JujuObjectType.Controller]: ControllerGrantPermission;
  [JujuObjectType.ApplicationOffer]: ApplicationOfferGrantPermission;
};

export type GrantPermissionForObject<O extends JujuObjectType> =
  ObjectPermissionMap[O];

export abstract class UserImplementation {
  /**
   * Login to the dashboard with the provided playwright page.
   */
  abstract login(page: Page, user: User): Promise<void>;

  /**
   * Provide the credentials for a user that matches the provided conditions. If no user matches
   * the conditions, an error will be thrown.
   *
   * This is intended to assist with implementations where users are hard-coded during setup.
   */
  abstract getUser(userKind: UserKind, id: number): Promise<User>;

  abstract grant<O extends JujuObjectType>(
    username: string,
    object: JujuObject<O>,
    permission: GrantPermissionForObject<O>,
  ): Action;
}

export class UserStore {
  private static instance: UserImplementation;

  static get get() {
    if (!UserStore.instance) {
      switch (process.env.AUTH_MODE) {
        case "juju":
          UserStore.instance = new Juju();
          break;
        case "candid":
          break;
        case "jimm":
          break;
        default:
          throw new Error(
            `Unknown auth mode: ${process.env.AUTH_MODE} (ensure that \`AUTH_MODE\` env var is correct set)`,
          );
      }
    }

    return UserStore.instance;
  }
}

export enum UserKind {
  SuperAdmin,
  Admin,
  User,
}

export type User = { username: string; password: string };
