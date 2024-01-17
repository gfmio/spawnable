# spawnable

This package provides helpers for spawning child processes.

## Install

```sh
# If you're using npm
npm install spawnable

# If you're using yarn
yarn add spawnable

# If you're using pnpm
pnpm add spawnable
```

## Usage

You can use `spawnable` to conveniently create and/or manager child processes
and wait for their execution to complete while retaining access to the child
process object and being able to handle streams.

You can use `Spawnable` to prepare and later spawn a child process.

```ts
import { Spawnable } from "spawnable";

const spawnable = new Spawnable(["ls", "-la"], {
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});

await spawnable.spawn();

const childProcess = spawnable.childProcess()!;

// Do something with `childProcess`...

await spawnable.waitForExit();
```

Alternatively, you can also manage an existing `ChildProcess` using `Spawned`.

```ts
import { spawn } from "node:child_process";

import { Spawned } from "spawnable";

const childProcess = spawn("ls", ["-la"], {
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});

const spawned = new Spawned(childProcess);

await spawned.waitForSpawn();

// Do something with `childProcess`...

await spawned.waitForExit();
```

`Spawnable` and `Spawned` will throw an `ExitedWithExitCodeError` if the child
process exited with a non-zero exit code.

`Spawnable` and `Spawned` will throw a `KilledWithSignalError` if the child
process was killed with a `NodeJS.Signal`.

`Spawnable` will throw an `AlreadySpawnedError` if you attempt to call `spawn()`
multiple times.

`Spawnable` will throw an `EmptyCommandError` if you pass an empty command array
or if the first string in the array is empty.

`Spawnable` will throw `NotYetSpawnedError` if you attempt to invoke `kill()`,
`waitForSpawn()` or `waitForExit()` before `spawn()` has been invoked.

## License

[MIT](./LICENSE)