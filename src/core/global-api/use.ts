import { GlobalAPI } from "src/types/global-api";

/** 将 Vue 传入插件中，插件不需要依赖 Vue, 防止 Vue 迭代导致版本错误 */
export function initUse(Vue: GlobalAPI) {}
