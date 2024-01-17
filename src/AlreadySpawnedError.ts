import ExtendableError from "ts-error";

export class AlreadySpawnedError extends ExtendableError {
  constructor() {
    super("Process has already been spawned.");
  }
}
