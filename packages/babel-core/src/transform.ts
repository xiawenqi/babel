import gensync from "gensync";

import loadConfig from "./config";
import type { InputOptions, ResolvedConfig } from "./config";
import { run } from "./transformation";

import type { FileResult, FileResultCallback } from "./transformation";

type Transform = {
  (code: string, callback: FileResultCallback): void;
  (
    code: string,
    opts: InputOptions | undefined | null,
    callback: FileResultCallback,
  ): void;
  (code: string, opts?: InputOptions | null): FileResult | null;
};

const transformRunner = gensync<
  (code: string, opts?: InputOptions) => FileResult | null
>(function* transform(code, opts) {
  const config: ResolvedConfig | null = yield* loadConfig(opts);
  if (config === null) return null;

  return yield* run(config, code);
});

export const transform: Transform = function transform(code, opts?, callback?) {
  if (typeof opts === "function") {
    callback = opts;
    opts = undefined;
  }

  if (callback === undefined) {
    if (process.env.BABEL_8_BREAKING) {
      throw new Error(
        "Starting from Babel 8.0.0, the 'transform' function expects a callback. If you need to call it synchronously, please use 'transformSync'.",
      );
    } else {
      // console.warn(
      //   "Starting from Babel 8.0.0, the 'transform' function will expect a callback. If you need to call it synchronously, please use 'transformSync'.",
      // );
      return transformRunner.sync(code, opts);
    }
  }

  transformRunner.errback(code, opts, callback);
};

export const transformSync = transformRunner.sync;
export const transformAsync = transformRunner.async;
