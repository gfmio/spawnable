import { EventEmitter } from "eventemitter3";
import type { ChildProcess } from "node:child_process";
import { ExitedWithExitCodeError } from "./ExitedWithExitCodeError";
import { KilledWithSignalError } from "./KilledWithSignalError";

export class Spawned {
  protected readonly _childProcess: ChildProcess;
  protected _spawned = false;
  protected _done = false;
  protected _exitCode?: number | undefined;
  protected _signal?: NodeJS.Signals | undefined;

  protected readonly spawnPromise: Promise<this>;
  protected readonly exitPromise: Promise<this>;

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

  protected readonly onSpawn = () => {
    this._spawned = true;
    this.eventEmitter.emit("spawn");
  };

  protected readonly onError = (error: Error) => {
    this.eventEmitter.emit("error", error);
  };

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

  protected createSpawnPromise() {
    return new Promise<this>((resolve, reject) => {
      const onSpawn = () => {
        cleanup();
        resolve(this);
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

  protected createExitPromise() {
    return new Promise<this>((resolve, reject) => {
      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        cleanup();
        if (signal !== null) {
          reject(new KilledWithSignalError(signal));
        } else if (code === null) {
          reject(new Error("Both code and signal are null."));
        } else if (code === 0) {
          resolve(this);
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

  public hasSpawned(): boolean {
    return this._spawned;
  }

  public isDone(): boolean {
    return this._done;
  }

  public wasKilled(): boolean {
    return this._signal !== undefined;
  }

  public hasExitedSuccessfully(): boolean {
    return !this.wasKilled() && this._exitCode === 0;
  }

  public hasExitedWithError(): boolean {
    return !this.wasKilled() && this._exitCode !== 0;
  }

  public signal(): NodeJS.Signals | undefined {
    return this._signal;
  }

  public exitCode(): number | undefined {
    return this._exitCode;
  }

  public childProcess(): ChildProcess {
    return this._childProcess;
  }

  public kill(signal: NodeJS.Signals = "SIGINT") {
    this._childProcess.kill(signal);
  }

  public waitForSpawn(): Promise<this> {
    return this.spawnPromise;
  }

  public waitForExit(): Promise<this> {
    return this.exitPromise;
  }
}
