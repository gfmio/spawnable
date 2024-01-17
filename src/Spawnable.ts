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

  async spawn(): Promise<this> {
    if (this.spawned !== undefined) {
      throw new AlreadySpawnedError();
    }
    const [first, ...rest] = this.command;

    if (!first) {
      throw new Error("No command provided");
    }

    const childProcess = this.options
      ? spawn(first, rest, this.options)
      : spawn(first, rest);

    this.spawned = new Spawned(childProcess);

    await this.spawned.waitForSpawn();

    return this;
  }

  hasSpawned(): boolean {
    return !!this.spawned?.hasSpawned();
  }

  isDone(): boolean {
    return !!this.spawned?.isDone();
  }

  wasKilled(): boolean {
    return !!this.spawned?.wasKilled();
  }

  hasExitedSuccessfully(): boolean {
    return !!this.spawned?.hasExitedSuccessfully();
  }

  hasExitedWithError(): boolean {
    return !!this.spawned?.hasExitedWithError();
  }

  signal(): NodeJS.Signals | undefined {
    return this.spawned?.signal();
  }

  exitCode(): number | undefined {
    return this.spawned?.exitCode();
  }

  childProcess(): ChildProcess | undefined {
    return this.spawned?.childProcess();
  }

  kill(signal: NodeJS.Signals = "SIGINT") {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    return this.spawned.kill(signal);
  }

  async waitForSpawn(): Promise<this> {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    await this.spawned.waitForSpawn();

    return this;
  }

  async waitForExit(): Promise<this> {
    if (typeof this.spawned === "undefined") {
      throw new NotYetSpawnedError();
    }

    await this.spawned.waitForExit();

    return this;
  }
}
