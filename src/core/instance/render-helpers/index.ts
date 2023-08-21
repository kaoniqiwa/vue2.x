import { createTextVNode } from "core/vdom/create-text";
import { toString } from "src/shared/util";
import { ObjectType } from "src/types/component";

export function installRenderHelpers(target: ObjectType) {
  target._v = createTextVNode;
  target._s = toString;
}
