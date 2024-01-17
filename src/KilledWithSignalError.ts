import { ExtendableError } from "ts-error";

/**
 * Represents an error that occurs when a process is killed with a signal.
 */
export class KilledWithSignalError extends ExtendableError {
  constructor(public readonly signal: NodeJS.Signals) {
    super(`Process killed with signal ${signal}`);
  }
}
