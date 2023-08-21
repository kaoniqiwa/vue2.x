import { GlobalAPI } from "src/types/global-api";
import { initMixin } from "./mixin";
import { nextTick, warn } from "core/util";
import { ASSET_TYPES } from "src/shared/constants";
import { initAssetRegisters } from "./assets";
import { initUse } from "./use";
import { initExtend } from "./extend";
import config from "core/config";
import { __DEV__ } from "shared/util";
import { Component } from "src/types/component";

export function initGlobalAPI(Vue: GlobalAPI) {
  const configDef: Record<string, any> = {};
  configDef.get = () => config;
  if (__DEV__) {
    configDef.set = () => {
      warn(
        "Do not replace the Vue.config object, set individual fields instead."
      );
    };
  }
  Object.defineProperty(Vue, "config", configDef);
  Vue.util = {
    nextTick,
  };
  Vue.options = Object.create(null);

  /**
   * Vue.options.components = {}
   * Vue.options.filters = {}
   * Vue.options.directives = {}
   *
   */
  ASSET_TYPES.forEach((type) => {
    Vue.options[type + "s"] = Object.create(null);
  });

  /** _base 会被合并到所有 instance.$options 中 */
  Vue.options._base = Vue as unknown as typeof Component;

  Vue.nextTick = nextTick;

  initUse(Vue);
  initMixin(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}
