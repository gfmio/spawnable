import ExtendableError from "ts-error";

/**
 * Error thrown when a process has already been spawned.
 */
export class AlreadySpawnedError extends ExtendableError {
  constructor() {
    super("Process has already been spawned.");
  }
}
