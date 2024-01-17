import ExtendableError from "ts-error";

export class ExitedWithExitCodeError extends ExtendableError {
  constructor(public readonly code: number) {
    super(`Process exited with code ${code}`);
  }
}
