import { validateComponentName } from "core/util";
import { __DEV__, isPlainObject } from "shared/util";
import { ASSET_TYPES } from "src/shared/constants";
import { GlobalAPI } from "src/types/global-api";

export function initAssetRegisters(Vue: GlobalAPI) {
  /**
   * Vue.directive
   * Vue.component
   * Vue.filter
   */
  ASSET_TYPES.forEach((type) => {
    Vue[type] = function (id: string, definition?: Function | Object) {
      if (!definition) {
        return Vue.options[type + "s"][id];
      } else {
        if (__DEV__ && type === "component") {
          validateComponentName(id);
        }
        if (type == "component") {
          /**
           * 使用 Vue.extend() 将对象变成 Vue 构造函数
           * this 不一定指向 Vue,也有可能指向 Vue 子类
           */
          if (isPlainObject(definition)) {
            // @ts-expect-error
            definition.name = definition.name || id;
            definition = this.options._base.extend(definition);
          }
        } else if (type == "directive") {
        } else if (type == "filter") {
        }
        this.options[type + "s"][id] = definition;

        /** 返回 Vue 子类 */
        return definition;
      }
    };
  });
}
