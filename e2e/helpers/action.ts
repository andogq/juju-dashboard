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
 * Run the provided actions, returning a clean up function which will undo them.
 */
export async function runActions(actions: Action<unknown>[]) {
  const unwinds: (() => Promise<void>)[] = [];

  for (const action of actions) {
    const state = await action.run();
    unwinds.unshift(action.rollback.bind(action, state));
  }

  return async () => {
    for (const unwind of unwinds) {
      await unwind();
    }
  };
}
