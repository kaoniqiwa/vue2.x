import { _Set as Set, nextTick } from "core/util";
import Watcher from "./watcher";

const watcherSet = new Set();
const queue: Array<Watcher> = [];
let has: { [key: number]: boolean | null } = {};

/**
 * 将不同 watcher 加入 queue 队列，设定一个微任务来遍历 queue，实现延迟批量处理更新功能
 */
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id;
  if (watcherSet.has(id)) {
    return;
  }

  if (has[id] != null) {
    has[id] = true;
    queue.push(watcher);
  }

  nextTick(flushSchedulerQueue);
}

function flushSchedulerQueue() {
  queue.forEach((watcher) => watcher.run());
  queue.length = 0;
  watcherSet.clear();
}
