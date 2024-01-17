import { EventEmitter } from "eventemitter3";
import type { ChildProcess } from "node:child_process";
import { ExitedWithExitCodeError } from "./ExitedWithExitCodeError";
import { KilledWithSignalError } from "./KilledWithSignalError";

/**
 * Represents a spawned child process.
 */
export class Spawned {
  protected readonly _childProcess: ChildProcess;
  protected _spawned = false;
  protected _done = false;
  protected _exitCode?: number | undefined;
  protected _signal?: NodeJS.Signals | undefined;

  protected readonly spawnPromise: Promise<void>;
  protected readonly exitPromise: Promise<void>;

  protected readonly eventEmitter = new EventEmitter();

  constructor(childProcess: ChildProcess) {
    this._childProcess = childProcess;

    childProcess.on("spawn", this.onSpawn);
    childProcess.on("error", this.onError);
    childProcess.on("close", this.onCloseOrExit);
    childProcess.on("exit", this.onCloseOrExit);

    this.spawnPromise = this.createSpawnPromise();
    this.exitPromise = this.createExitPromise();
  }

  /**
   * Handles the spawn event and emits a `spawn` event through the event
   * emitter.
   */
  protected readonly onSpawn = () => {
    this._spawned = true;
    this.eventEmitter.emit("spawn");
  };

  /**
   * Handles the error event and emits the error through the event emitter.
   * @param error - The error object.
   */
  protected readonly onError = (error: Error) => {
    this.eventEmitter.emit("error", error);
  };

  /**
   * Callback function called when the spawned process is closed or exited.
   *
   * Emits an `exit` event through the event emitter.
   *
   * Deduplicates the `close` and `exit` event by setting the `_done` flag to
   * true.
   *
   * @param code The exit code of the process. If null, it means the process was terminated by a signal.
   * @param signal The signal that caused the process to terminate. If null, it means the process exited normally.
   */
  protected readonly onCloseOrExit = (
    code: number | null,
    signal: NodeJS.Signals | null
  ) => {
    if (this._done) {
      return;
    }

    this._done = true;

    if (code !== null) {
      this._exitCode = code;
    }

    if (signal) {
      this._signal = signal;
    }

    this.eventEmitter.emit("exit", code, signal);
  };

  /**
   * Creates a promise that resolves when the spawn event occurs or rejects when
   * an error event occurs.
   *
   * If the child process has already been spawned, the promise resolves
   * immediately.
   *
   * @returns A promise that resolves with void when the spawn event occurs or rejects with an error when an error event occurs.
   */
  protected createSpawnPromise(): Promise<void> {
    if (typeof this._childProcess.pid !== "undefined") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const onSpawn = () => {
        cleanup();
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.eventEmitter.removeListener("error", onError, undefined, true);
        this.eventEmitter.removeListener("spawn", onSpawn, undefined, true);
      };

      const start = () => {
        this.eventEmitter.once("error", onError, undefined);
        this.eventEmitter.once("spawn", onSpawn, undefined);
      };

      start();
    });
  }

  /**
   * Creates a promise that resolves when the spawned process exits successfully
   * or rejects when it exits with an error.
   *
   * @returns A promise that resolves with void when the process exits successfully, or rejects with an error when it exits with an error.
   */
  protected createExitPromise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        cleanup();
        if (signal !== null) {
          reject(new KilledWithSignalError(signal));
        } else if (code === null) {
          reject(new Error("Both code and signal are null."));
        } else if (code === 0) {
          resolve();
        } else {
          reject(new ExitedWithExitCodeError(code));
        }
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.eventEmitter.removeListener("error", onError, undefined, true);
        this.eventEmitter.removeListener("exit", onExit, undefined, true);
      };

      const start = () => {
        this.eventEmitter.once("error", onError, undefined);
        this.eventEmitter.once("exit", onExit, undefined);
      };

      start();
    });
  }

  /**
   * Checks if the child process has been spawned.
   * @returns {boolean} True if the child process has been spawned, false otherwise.
   */
  public hasSpawned(): boolean {
    return this._spawned;
  }

  /**
   * Checks if the spawned process is done.
   * @returns {boolean} True if the process is done, false otherwise.
   */
  public isDone(): boolean {
    return this._done;
  }

  /**
   * Checks if the spawned process was killed.
   * @returns {boolean} True if the spawned process was killed, false otherwise.
   */
  public wasKilled(): boolean {
    return this._signal !== undefined;
  }

  /**
   * Checks if the spawned process has exited successfully.
   * @returns {boolean} True if the process has exited successfully, false otherwise.
   */
  public hasExitedSuccessfully(): boolean {
    return !this.wasKilled() && this._exitCode === 0;
  }

  /**
   * Checks if the spawned process has exited with an error.
   * @returns {boolean} True if the process has exited with an error, false otherwise.
   */
  public hasExitedWithError(): boolean {
    return !this.wasKilled() && this._exitCode !== 0;
  }

  /**
   * Gets the signal the spawned process was killed with, if any.
   * @returns The signal or undefined if no signal was received.
   */
  public signal(): NodeJS.Signals | undefined {
    return this._signal;
  }

  /**
   * Returns the exit code of the spawned process, if any.
   * @returns The exit code of the spawned process, or undefined if the process has not exited yet or was killed with a signal.
   */
  public exitCode(): number | undefined {
    return this._exitCode;
  }

  /**
   * Returns the child process associated with this Spawned instance.
   * @returns The child process.
   */
  public childProcess(): ChildProcess {
    return this._childProcess;
  }

  /**
   * Kills the child process with the specified signal.
   * @param signal The signal to send to the child process. Defaults to "SIGINT".
   */
  public kill(signal: NodeJS.Signals = "SIGINT"): void {
    this._childProcess.kill(signal);
  }

  /**
   * Waits for the child process to have spawned.
   * @returns A promise that resolves to void once the child process has spawned.
   */
  public waitForSpawn(): Promise<void> {
    return this.spawnPromise;
  }

  /**
   * Waits for the spawned process to exit.
   * @returns A promise that resolves when the process exits.
   */
  public waitForExit(): Promise<void> {
    return this.exitPromise;
  }
}
