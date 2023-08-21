import { pluckModuleFunction } from "compiler/helpers";
import { stat } from "fs";
import {
  ASTAttr,
  ASTElement,
  ASTExpression,
  ASTIfConditions,
  ASTNode,
  ASTText,
  CodegenResult,
  CompilerOptions,
  DataGenFunction,
  TransformFunction,
} from "src/types/compiler";

function genElement(el: ASTElement, state: CodegenState) {
  if (el.if && !el.ifProcessed) {
    return genIf(el, state);
  } else if (el.tag == "template") {
    return genChildren(el, state) || "void 0";
  } else {
    let data;
    /** el.plain 为 true 表示元素上没有添加任何属性，不需要 genData
     *  <div>hello</div> 纯净的元素
     */
    if (!el.plain) {
      data = genData(el, state);
    }

    let tag: string | undefined;

    if (!tag) {
      tag = `'${el.tag}'`;
    }
    const children = genChildren(el, state);
    const code = `_c(${tag}${data ? `,${data}` : ""}${
      children ? `,${children}` : ""
    })`;

    return code;
  }
}

/**创建子元素 */
function genChildren(el: ASTElement, state: CodegenState) {
  let children = el.children;
  if (children.length) {
    const le = children[0];
    if (children.length == 1) {
    }
    const normalizationType = 0;
    const gen = genNode;

    return `[${children.map((c) => gen(c, state)).join(",")}]${
      normalizationType ? `,${normalizationType}` : ""
    }`;
  }
}
/**创建数据 */
function genData(el: ASTElement, state: CodegenState): string {
  let data = "{";

  // key
  if (el.key) {
    data += `key:${el.key},`;
  }
  /**
   * data:'{staticClass:"foo",staticStyle:{"color":"red","font-size":"20px"},'
   */
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el);
  }
  if (el.attrs) {
    /**
     * data:'{staticClass:"foo",staticStyle:{"color":"red","font-size":"20px"},attrs:{"id":"app"},'
     */
    data += `attrs:${genProps(el.attrs)},`;
  }
  /** '{staticClass:"foo",staticStyle:{"color":"red","font-size":"20px"},attrs:{"id":"app"}}'  */
  data = data.replace(/,$/, "") + "}";
  return data;
}
/**
 * el.attrs = [
 *    {name:'id',value:'"app"',start:,end:,dynamic:}
 *  ]
 */
function genProps(props: Array<ASTAttr>) {
  let staticProps = ``;
  let dynamicProps = ``;
  for (let i = 0, l = props.length; i < l; i++) {
    const prop = props[i];
    if (prop.dynamic) {
    } else {
      staticProps += `"${prop.name}":${prop.value},`;
    }
  }
  staticProps = `{${staticProps.replace(/,$/, "")}}`;
  if (dynamicProps) {
    return dynamicProps;
  } else {
    return staticProps;
  }
}

function genNode(node: ASTNode, state: CodegenState): string {
  if (node.type == Node.ELEMENT_NODE) {
    return genElement(node, state);
  } else if (node.type == Node.TEXT_NODE && node.isComment) {
    return "";
  } else {
    return genText(node);
  }
}
function genIf(el: ASTElement, state: CodegenState) {
  el.ifProcessed = true;
  return genIfConditions(el.ifConditions!.slice(), state);
}

function genIfConditions(
  conditions: ASTIfConditions,
  state: CodegenState
): string {
  if (!conditions.length) {
    return "_e()";
  }
  const condition = conditions.shift()!;
  if (condition.exp) {
    return `(${condition.exp})?${genTernaryExp(
      condition.block
    )}:${genIfConditions(conditions, state)}`;
  } else {
    return `${genTernaryExp(condition.block)}`;
  }

  function genTernaryExp(el: ASTElement) {
    return genElement(el, state);
  }
}
/**
 * template:"hello" 为纯文本时，ast 为 undefined
 * @param ast
 * @param options
 */
export function generate(
  ast: ASTElement | undefined,
  options: CompilerOptions
): CodegenResult {
  const state = new CodegenState(options);
  const code = ast
    ? ast.tag === "script"
      ? "null"
      : genElement(ast, state)
    : '_c("div")'; // 纯文本的情况

  return {
    /**执行时，this指向 vue 实例，通过 with 创建局部作用域 */
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns,
  };
}
export function genText(text: ASTText | ASTExpression): string {
  return `_v(${
    text.type == Node.ATTRIBUTE_NODE
      ? text.expression
      : JSON.stringify(text.text)
  })`;
}
class CodegenState {
  options: CompilerOptions;
  staticRenderFns: Array<string>;
  dataGenFns: Array<DataGenFunction>;

  constructor(options: CompilerOptions) {
    this.options = options;
    this.staticRenderFns = [];
    this.dataGenFns = pluckModuleFunction(options.modules, "genData");
  }
}
