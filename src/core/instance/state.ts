import { observe } from "core/observer";
import { isReserved, nativeWatch, warn } from "core/util";
import { __DEV__, isFunction, isPlainObject, noop } from "src/shared/util";
import { Component, ObjectType } from "src/types/component";

export function stateMixin(Vue: typeof Component) {
  const dataDef: Pick<PropertyDescriptor, "get" | "set"> = {
    get(this: Component) {
      return this._data;
    },
  };
  if (__DEV__) {
    dataDef.set = function (this: Component) {
      warn(
        "Avoid replacing instance root $data. " +
          "Use nested data properties instead.",
        this
      );
    };
  }

  Object.defineProperty(Vue.prototype, "$data", dataDef);
}
export function initState(vm: Component) {
  const opts = vm.$options;

  if (opts.props) {
    initProps();
  }
  if (opts.data) {
    initData(vm);
  } else {
    vm._data = {};
  }
  if (opts.methods) {
    initMethods(vm, opts.methods);
  }
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
  if (opts.watch && opts.watch != nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps() {}

function initData(vm: Component) {
  let d = vm.$options.data;
  /** 获得对象类型数据 */
  let data = isFunction(d) ? getData(d, vm) : d || {};
  vm._data = data;
  if (!isPlainObject(data)) {
    data = {};
    __DEV__ &&
      warn(
        "data functions should return an  object:\n" +
          "https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
        vm
      );
  }

  const props = vm.$options.props;
  const methods = vm.$options.methods;

  Object.keys(data).forEach((key) => {
    if (methods && Object.hasOwn(methods, key)) {
      console.warn(
        `Method "${key}" has already been defined as a data property.`
      );
    }
    if (props && Object.hasOwn(props, key)) {
      console.warn(
        `The data property "${key}" is already declared as a prop. ` +
          `Use prop default value instead.`
      );
    }
    /**
     * 属性名不是 $xxx或者 _xxx，则将属性代理到 vue 实例上
     * vm.msg => vm._data.msg
     * 无效的属性名:
     * data:{
     *    $msg:'hello',
     *    _data:10
     * }
     */
    if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  });
  /** 劫持数据 */
  observe(data);
}

function initMethods(vm: Component, methods: Record<string, Function>) {}

function initComputed(vm: Component, computed: Record<string, any>) {}

function initWatch(vm: Component, watch: Record<string, any>) {}

// this 指向 Vue 实例,可以拿到 props 属性
function getData(data: Function, vm: Component): object {
  try {
    return data.call(vm, vm);
  } catch (e: any) {
    console.error("[Vue warn]" + e);
    return {};
  }
}

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};
function proxy(target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter(this: ObjectType) {
    return this[sourceKey][key];
  };
  sharedPropertyDefinition.set = function (this: ObjectType, val: any) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
