import { Options, defineConfig } from "tsup";

const defaults: Options = {
  clean: true,
  dts: true,
  sourcemap: false,
  outExtension: ({ format }) => {
    switch (format) {
      case "cjs": {
        return {
          js: ".cjs",
          dts: ".d.ts",
        };
      }
      case "esm": {
        return {
          js: ".mjs",
          dts: ".d.ts",
        };
      }
      case "iife": {
        return {
          js: ".js",
          dts: ".d.ts",
        };
      }
    }
  },
};

export default defineConfig([
  {
    ...defaults,
    entry: {
      index: "src/index.ts",
    },
    format: ["esm"],
  },
  {
    ...defaults,
    entry: {
      index: "src/index.ts",
    },
    dts: false,
    format: ["cjs"],
  },
]);
