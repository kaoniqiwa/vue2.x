import { makeMap } from "shared/util";

export const namespaceMap: Record<string, string> = {
  svg: "http://www.w3.org/2000/svg",
  math: "http://www.w3.org/1998/Math/MathML",
  xhtml: "http://www.w3.org/1999/xhtml",
};

export const isHTMLTag = makeMap(
  "html,body,base,head,link,meta,style,title," +
    "address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section," +
    "div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul," +
    "a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby," +
    "s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video," +
    "embed,object,param,source,canvas,script,noscript,del,ins," +
    "caption,col,colgroup,table,thead,tbody,td,th,tr," +
    "button,datalist,fieldset,form,input,label,legend,meter,optgroup,option," +
    "output,progress,select,textarea," +
    "details,dialog,menu,menuitem,summary," +
    "content,element,shadow,template,blockquote,iframe,tfoot"
);

export const isSVG = makeMap(
  "svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face," +
    "foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern," +
    "polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view",
  true
);

/** tag 是否是 pre 标签 */
export const isPreTag = (tag?: string): boolean => tag === "pre";

/**
 * 如果不是保留标签，则判断为自定义组件名
 */
export const isReservedTag = (tag: string): boolean => {
  return !!isHTMLTag(tag) || !!isSVG(tag);
};
export function getTagNamespace(tag: string): string | undefined {
  if (isSVG(tag)) {
    return "svg";
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === "math") {
    return "math";
  }
}
