import {
  spawn,
  type ChildProcess,
  type SpawnOptionsWithStdioTuple,
  type SpawnOptionsWithoutStdio,
  type StdioNull,
  type StdioPipe,
} from "node:child_process";
import { AlreadySpawnedError } from "./AlreadySpawnedError";
import { NotYetSpawnedError } from "./NotYetSpawnedError";
import { Spawned } from "./Spawned";
import { EmptyCommandError } from ".";

/**
 * Represents a spawnable child process.
 */
export class Spawnable {
  protected spawned?: Spawned;

  constructor(
    public readonly command: string[],
    public readonly options?:
      | SpawnOptionsWithStdioTuple<
          StdioNull | StdioPipe,
          StdioNull | StdioPipe,
          StdioNull | StdioPipe
        >
      | SpawnOptionsWithoutStdio
      | undefined
  ) {}

  /**
   * Spawns a child process with the provided command and options.
   *
   * @returns A promise that resolves to void once the child process has spawned.
   * @throws {AlreadySpawnedError} If the child process has already been spawned.
   * @throws {EmptyCommandError} If no command is provided.
   */
  async spawn(): Promise<void> {
    if (this.spawned !== undefined) {
      throw new AlreadySpawnedError();
    }
    const [first, ...rest] = this.command;

    if (!first) {
      throw new EmptyCommandError();
    }

    const childProcess = this.options
      ? spawn(first, rest, this.options)
      : spawn(first, rest);

    this.spawned = new Spawned(childProcess);

    await this.spawned.waitForSpawn();
  }

  /**
   * Checks if the child process has been spawned.
   * @returns {boolean} True if the child process has been spawned, false otherwise.
   */
  hasSpawned(): boolean {
    return !!this.spawned?.hasSpawned();
  }

  /**
   * Checks if the spawned process is done.
   * @returns {boolean} True if the process is done, false otherwise.
   */
  isDone(): boolean {
    return !!this.spawned?.isDone();
  }

  /**
   * Checks if the spawned process was killed.
   * @returns {boolean} True if the spawned process was killed, false otherwise.
   */
  wasKilled(): boolean {
    return !!this.spawned?.wasKilled();
  }

  /**
   * Checks if the spawned process has exited successfully.
   * @returns {boolean} True if the process has exited successfully, false otherwise.
   */
  hasExitedSuccessfully(): boolean {
    return !!this.spawned?.hasExitedSuccessfully();
  }

  /**
   * Checks if the spawned process has exited with an error.
   * @returns {boolean} True if the process has exited with an error, false otherwise.
   */
  hasExitedWithError(): boolean {
    return !!this.spawned?.hasExitedWithError();
  }

  /**
   * Gets the signal the spawned process was killed with, if any.
   * @returns The signal or undefined if no signal was received.
   */
  signal(): NodeJS.Signals | undefined {
    return this.spawned?.signal();
  }

  /**
   * Returns the exit code of the spawned process, if any.
   * @returns The exit code of the spawned process, or undefined if the process has not exited yet or was killed with a signal.
   */
  exitCode(): number | undefined {
    return this.spawned?.exitCode();
  }

  /**
   * Returns the child process, if it has been spawned already.
   * @returns The child process object or undefined if not available.
   */
  childProcess(): ChildProcess | undefined {
    return this.spawned?.childProcess();
  }

  /**
   * Kills the spawned process with the specified signal.
   * @param signal The signal to send to the process. Defaults to "SIGINT".
   * @throws {NotYetSpawnedError} If the process has not been spawned yet.
   */
  kill(signal: NodeJS.Signals = "SIGINT"): void {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    return this.spawned.kill(signal);
  }

  /**
   * Waits for the child process to have spawned.
   * @returns A promise that resolves once the child process has spawned.
   * @throws {NotYetSpawnedError} If `spawn()` has not been called yet.
   */
  async waitForSpawn(): Promise<void> {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    await this.spawned.waitForSpawn();
  }

  /**
   * Waits for the spawned process to exit.
   * @returns A promise that resolves when the process has exited.
   * @throws {NotYetSpawnedError} If `spawn()` has not been called yet.
   */
  async waitForExit(): Promise<void> {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    await this.spawned.waitForExit();
  }
}
