import ExtendableError from "ts-error";

export class EmptyCommandError extends ExtendableError {
  constructor() {
    super("The provided command is empty.");
  }
}
