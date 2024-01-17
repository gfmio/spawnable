import ExtendableError from "ts-error";

/**
 * Error thrown when a process has not been spawned yet.
 */
export class NotYetSpawnedError extends ExtendableError {
  constructor() {
    super("Process has not been spawned yet.");
  }
}
