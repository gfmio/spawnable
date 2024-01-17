import ExtendableError from "ts-error";

export class NotYetSpawnedError extends ExtendableError {
  constructor() {
    super("Process has not been spawned yet.");
  }
}
