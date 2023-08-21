import _Vue from "core/index";
import { isReservedTag, query } from "../util";
import { inBrowser } from "core/util";
import { mountComponent } from "core/instance/lifecycle";
import { Component } from "src/types/component";
import { patch } from "./patch";
import { noop } from "src/shared/util";

const Vue: typeof Component = _Vue as unknown as typeof Component;

Vue.config.isReservedTag = isReservedTag;

Vue.prototype.__patch__ = inBrowser ? patch : noop;

/**如果没有模版编译，则直接调用该函数 */
Vue.prototype.$mount = function (el?: string | Element) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el);
};
export default Vue;
