import { noop } from "shared/util";
import { isIE, isIOS, isNative } from ".";

const callbacks: Array<Function> = [];

let pending = false;

let timerFunc: Function;

if (typeof Promise !== "undefined" && isNative(Promise)) {
  timerFunc = () => {
    /** 仅需要 promise 的微任务 */
    Promise.resolve().then(flushCallbacks);
    if (isIOS) {
      /** BUG: ios 中微任务不会理解 flush， */
      setTimeout(noop);
    }
  };
} else if (
  !isIE &&
  typeof MutationObserver !== "undefined" &&
  (isNative(MutationObserver) ||
    MutationObserver.toString() === "[object MutationObserverConstructor]")
) {
  let counter = 1;
  const observer = new MutationObserver(flushCallbacks);
  const textNode = document.createTextNode(String(counter));
  /**
   * 监听文本节点的文本变化,一旦变化，则会调用 flushCallbacks,注意这是个微任务
   */
  observer.observe(textNode, {
    characterData: true,
  });
  timerFunc = () => {
    /**
     * counter 永远在 0 和 1 之间变化
     * 如果 counter += 1,会有整型溢出风险
     */
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
} else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0);
  };
}
export function nextTick(cb: Function, ctx?: Object) {
  callbacks.push(() => cb.call(ctx));

  if (!pending) {
    pending = true;
    timerFunc();
  }
}

function flushCallbacks() {
  callbacks.forEach((cb) => cb());
}
