import fs from "node:fs/promises";

import { exec } from "utils/exec";

import {
  type Resource,
  CloudAccessType,
  ModelAccessTypes,
  ResourceType,
} from "../fixtures/setup";

import { Action, runActions } from "./action";
import { JujuObject, ModelGrantPermission, UserStore } from "./user";

export class AddModel extends Action {
  constructor(private name: string) {
    super();
  }

  async run() {
    await exec(`juju add-model '${this.name}'`);
  }

  async rollback() {
    await exec(`juju destroy-model '${this.name}' --force --no-prompt`);
  }
}

export class GrantCloud extends Action {
  constructor(
    private username: string,
    private accessType: CloudAccessType,
    private cloudName: string = process.env.PROVIDER as string,
  ) {
    super();
  }

  async run() {
    await exec(
      `juju grant-cloud '${this.username}' '${this.accessType}' '${this.cloudName}'`,
    );
  }

  async rollback() {
    await exec(
      `juju revoke-cloud '${this.username}' ${this.accessType} ${this.cloudName}`,
    );
  }
}

export class AddSharedModel extends Action<() => Promise<void>> {
  constructor(
    private username: string,
    private modelName: string,
  ) {
    super();
  }

  async run() {
    return await runActions([
      new GrantCloud(this.username, CloudAccessType.ADD_MODEL),
      new AddModel(this.modelName),
      UserStore.get.grant(
        this.username,
        JujuObject.Model(this.modelName),
        ModelGrantPermission.Read,
      ),
    ]);
  }

  async rollback(cleanup: () => Promise<void>) {
    await cleanup();
  }
}

export class JujuHelpers {
  private cleanupStack: Resource[];

  constructor(cleanupStack?: Resource[]) {
    this.cleanupStack = cleanupStack || [];
  }

  async removeModel(
    modelName: string,
    owner: string | undefined = process.env.USERNAME,
  ) {
    await exec(
      `juju destroy-model '${owner}/${modelName}' --force --no-prompt`,
    );
  }

  async removeUser(userName: string) {
    await exec(`juju remove-user '${userName}' -y`);
  }

  async revokeCloud(accessType: string | CloudAccessType, userName?: string) {
    await exec(
      `juju revoke-cloud '${userName}' ${accessType} ${process.env.PROVIDER}`,
    );
  }

  async addToCleanupStack(
    resourceName: string,
    type: ResourceType,
    owner: string | undefined = process.env.USERNAME,
  ) {
    this.cleanupStack.push({ resourceName, type, owner });
  }

  async addModel(
    modelName: string,
    owner: string | undefined = process.env.USERNAME,
  ) {
    await exec(`juju add-model '${modelName}'`);
    await this.addToCleanupStack(modelName, ResourceType.MODEL, owner);
  }

  async addUser(userName: string) {
    await exec(
      `juju add-user --controller '${process.env.CONTROLLER_NAME}' '${userName}'`,
    );
    await this.addToCleanupStack(userName, ResourceType.USER);
    await exec(
      `{ echo password2; echo password2; } | juju change-user-password '${userName}'`,
    );
  }

  async grantCloud(userName: string, accessType: CloudAccessType) {
    await exec(
      `juju grant-cloud '${userName}' ${accessType} ${process.env.PROVIDER}`,
    );
    await this.addToCleanupStack(accessType, ResourceType.CLOUD, userName);
  }

  async jujuLogout() {
    await exec("juju logout");
  }

  async jujuLogin(
    userName: string | undefined = process.env.USERNAME,
    password: string | undefined = process.env.PASSWORD,
  ) {
    if (!userName || !password) {
      throw new Error("Cannot login without credentials");
    }
    await exec(`echo '${password}' | juju login -u '${userName}' --no-prompt`);
  }

  async adminLogin() {
    await this.jujuLogout();
    await this.jujuLogin();
    await exec("juju switch controller");
  }

  async addCredential(userName: string, password: string) {
    const templateFilePath = "e2e/helpers/credentials-template.yaml";
    try {
      let yamlContent = await fs.readFile(templateFilePath, "utf-8");

      yamlContent = yamlContent.replace(/\{\{username\}\}/g, userName);
      yamlContent = yamlContent.replace(/\{\{password\}\}/g, password);

      const tmpFilePath = `e2e/helpers/juju-cred-${Date.now()}.yaml`;
      await fs.writeFile(tmpFilePath, yamlContent, "utf8");

      await exec(
        `juju add-credential ${process.env.PROVIDER} -f ${tmpFilePath} -c '${process.env.CONTROLLER_NAME}'`,
      );
      await fs.unlink(tmpFilePath);
    } catch (error) {
      console.error("Error setting up credentials:", error);
      throw error;
    }
  }

  async grantModelAccess(
    accessType: ModelAccessTypes,
    modelName: string,
    userName: string | undefined = process.env.USERNAME,
  ) {
    if (!userName) {
      throw new Error("Cannot login without username");
    }
    await exec(`juju grant '${userName}' ${accessType} '${modelName}'`);
  }

  async addSharedModel(modelName: string, userName: string) {
    await this.addUser(userName);
    await this.grantCloud(userName, CloudAccessType.ADD_MODEL);
    await this.jujuLogout();
    await this.jujuLogin(userName, "password2");
    await this.addCredential(userName, "password2");
    await this.addModel(modelName, userName);
    await this.grantModelAccess(ModelAccessTypes.READ, modelName);
  }

  async cleanup() {
    console.log("Running Juju cleanup...");
    await this.adminLogin();

    while (this.cleanupStack.length > 0) {
      const resource = this.cleanupStack.pop();
      if (resource) {
        const { resourceName, type, owner } = resource;
        console.log(`Removing Juju ${type}: ${resourceName}`);
        try {
          if (type === ResourceType.MODEL) {
            await this.removeModel(resourceName, owner);
          } else if (type === ResourceType.USER) {
            await this.removeUser(resourceName);
          } else if (type === ResourceType.CLOUD) {
            await this.revokeCloud(resourceName, owner);
          }
        } catch (error) {
          console.warn(`Error removing ${type} ${resourceName}:`, error);
        }
      }
    }
  }
}
