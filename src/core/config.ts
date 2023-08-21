import { no } from "shared/util";
import { Component } from "src/types/component";

export interface Config {
  silent: boolean;
  optionMergeStrategies: { [key: string]: Function };

  warnHandler?: (msg: string, vm: Component | undefined, trace: string) => void;

  /** 平台相关配置 */
  isReservedTag: (x: string) => boolean | undefined;
}
export default {
  optionMergeStrategies: Object.create(null),
  silent: false,
  warnHandler: null,

  isReservedTag: no,
} as unknown as Config;
