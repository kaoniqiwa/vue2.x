import { Component } from "src/types/component";
import Dep, { DepTarget, pushTarget } from "./dep";
import { __DEV__, isFunction } from "src/shared/util";
import { SimpleSet, _Set as Set } from "core/util/";
import { queueWatcher } from "./scheduler";

let uid = 0;

export default class Watcher implements DepTarget {
  vm?: Component;
  /**uid号 */
  id: number;
  /**原始表达式,方便观察 wather 的来源 */
  expression: string;

  /**取值函数 */
  getter: Function;
  depIds: SimpleSet;
  deps: Array<Dep>;

  value: any;

  constructor(
    vm: Component | undefined,
    expOrFn: () => any,
    cb: Function,
    isRenderWatcher?: boolean
  ) {
    if ((this.vm = vm) && isRenderWatcher) {
      /**渲染函数的 watcher  */
      vm._watcher = this;
    }

    this.id = ++uid;
    // console.log("watcher:", this.id);
    this.deps = [];
    this.depIds = new Set();

    this.expression = __DEV__ ? expOrFn.toString() : "";
    if (isFunction(expOrFn)) {
      this.getter = expOrFn;
    } else {
      this.getter = expOrFn;
    }

    this.value = this.get();
  }

  get() {
    // console.log("watcher get");
    pushTarget(this);
    let value;
    /**
     * 执行getter(),在 getter 中如果需要访问 vm 数据则会触发数据的 getter 访问器 defineReactive
     * 由于 pushTarget(this)，Dep.target 指向当前 watcher 实例
     * 在 getter 访问器中通过 Dep.target 拿到 watcher 实例
     * 将 watcher 实例 push()到 Dep 中，完成依赖收集
     * 以后每次 vm 属性值发生改变时,遍历 Dep 保存的 watcher 实例数组，从而实现更新
     *
     */
    value = this.getter();

    return value;
  }
  addDep(dep: Dep): void {
    if (!this.depIds.has(dep.id)) {
      /** 双向保存 */
      this.depIds.add(dep.id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
  update(): void {
    queueWatcher(this);
  }
  run() {
    this.get();
  }
}
