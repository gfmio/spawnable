import ExtendableError from "ts-error";

/**
 * Error thrown when the provided command is empty.
 */
export class EmptyCommandError extends ExtendableError {
  constructor() {
    super("The provided command is empty.");
  }
}
