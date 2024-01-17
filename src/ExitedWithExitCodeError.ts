import ExtendableError from "ts-error";

/**
 * Error class representing an error when a process exits with a specific exit code.
 */
export class ExitedWithExitCodeError extends ExtendableError {
  constructor(public readonly code: number) {
    super(`Process exited with code ${code}`);
  }
}
