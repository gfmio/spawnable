import ExtendableError from "ts-error";

export class KilledWithSignalError extends ExtendableError {
  constructor(public readonly signal: NodeJS.Signals) {
    super(`Process killed with signal ${signal}`);
  }
}
