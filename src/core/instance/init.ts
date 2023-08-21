import { Component } from "src/types/component";
import { ComponentOptions, InternalComponentOptions } from "src/types/options";
import { initState } from "./state";
import { initRender } from "./render";
import { mergeOptions } from "core/util";
import { GlobalAPI } from "src/types/global-api";
import { callHook, initLifecycle } from "./lifecycle";
import { initEvents } from "./events";

let uid = 0;

export function initMixin(Vue: typeof Component) {
  Vue.prototype._init = function (options?: ComponentOptions) {
    const vm = this;
    this._uid = uid++;

    if (options && options._isComponent) {
      initInternalComponent(vm, options as any);
    } else {
      /**
       * 不能传参 Vue.options，
       * 因为 _init()方法会被子组件调用，此时的实参应该是子组件构造函数.options
       */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as unknown as GlobalAPI),
        options || {},
        vm
      );
    }

    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);

    /**初始化之前，数据还未代理到 vm 实例上 */
    callHook(vm, "beforeCreate");

    /** 初始化状态，处理 options 选项 */
    initState(vm);

    /**数据处理完成，数据已经代理到 vm 实例上 */
    callHook(vm, "created");

    /** 自动挂载元素 */
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
function resolveConstructorOptions(Ctor: GlobalAPI) {
  let optioins = Ctor.options;

  return optioins;
}

function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create((vm.constructor as any).options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions!;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
