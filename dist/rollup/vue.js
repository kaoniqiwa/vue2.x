/*!
 * Vue.js v1.0.0
 * (c) 2014-2023 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    const __DEV__ = undefined != "production";
    function noop(...res) { }
    const no = (...res) => false;
    const isArray = Array.isArray;
    const _toString = Object.prototype.toString;
    function genStaticKeys(modules) {
        return modules
            .reduce((keys, module) => {
            return keys.concat(module.staticKeys || []);
        }, [])
            .join(",");
    }
    function toString(val) {
        /**
         * val 如果是对象或者val是数组，但是数组中有对象，
         * JSON.stringify 会遍历对象，从而触发 defineReactive 中的 getter,
         * 从而实现有关对象的依赖收集
         */
        return val == null
            ? ""
            : isArray(val) || (isPlainObject(val) && val.toString === _toString)
                ? JSON.stringify(val, null, 2)
                : String(val);
    }
    function isFunction(value) {
        return typeof value === "function";
    }
    function isObject(o) {
        return o !== null && (typeof o === "function" || typeof o === "object");
    }
    function isPlainObject(o) {
        return (isObject(o) &&
            Object.prototype.toString.call(o) === "[object Object]" &&
            /** 对象是 Object 实例而不是自定义类实例 */
            (typeof o.constructor !== "function" || o.constructor.name === "Object"));
    }
    /** Object.hasOwn(obj,key) */
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key);
    }
    function extend(to, _from) {
        for (let key in _from) {
            to[key] = _from[key];
        }
        return to;
    }
    function makeMap(str, expectsLowerCase) {
        const map = Object.create(null);
        const list = str.split(",");
        list.forEach((key) => (map[key] = true));
        return expectsLowerCase
            ? (key) => map[key.toLocaleLowerCase()]
            : (key) => map[key];
    }
    /**
     * string,number,boolean,symbol,undefined,null,object + bigint
     * @param value
     * @returns
     */
    function isPrimitive(value) {
        return (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            typeof value === "symbol");
    }
    function isDef(v) {
        return v !== undefined && v !== null;
    }
    function isUndef(v) {
        return v === undefined || v === null;
    }
    function cached(fn) {
        const cache = Object.create(null);
        return function (key) {
            let hit = cache[key.toString()];
            return hit ? hit : (cache[key.toString()] = fn(key));
        };
    }
    /**
     * [object Array].slice(8,-1) 结果为 Array
     *
     */
    function toRawType(value) {
        return _toString.call(value).slice(8, -1);
    }
    /** Vue 内部组件名,自定义组件不得使用 */
    const isBuiltInTag = makeMap("slot,component", true);
    /**
     * hello-world => helloWorld
     * -webkit-user-select => WebkitUserSelect
     */
    const camelizeRE = /-(\w)/g;
    const camelize = cached((str) => {
        return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
    });
    /**
     * hello => Hello
     */
    const capitalize = cached((str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    /** \B 表示非单词边界,也就是 [A-Z]以前一定有字符且该字符不是空白字符 */
    const hyphenateRE = /\B([A-Z])/g;
    /**
     * 将驼峰式转成连字符
     * @example
     *  helloWorld => hello-World => hello-world
     */
    const hyphenate = cached((str) => {
        return str.replace(hyphenateRE, "-$1").toLowerCase();
    });
    function toObject(arr) {
        let res = {};
        arr.forEach((item) => {
            extend(res, item);
        });
        return res;
    }
    /** Vue 属性 */
    const isReservedAttribute = makeMap("key,ref,slot,slot-scope,is");

    var config = {
        optionMergeStrategies: Object.create(null),
        silent: false,
        warnHandler: null,
        isReservedTag: no,
        mustUseProp: no,
        async: true,
    };

    let warn$1 = noop;
    {
        const hasConsole = typeof console !== "undefined";
        warn$1 = (msg, vm) => {
            const trace = "";
            if (config.warnHandler) {
                config.warnHandler.call(null, msg, vm, trace);
            }
            else if (hasConsole && !config.silent) {
                console.error(`[Vue warn]: ${msg}${trace}`);
            }
        };
    }

    const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
    function def(obj, key, val, enumerable) {
        Object.defineProperty(obj, key, {
            value: val,
            enumerable: !!enumerable,
            writable: true,
            configurable: true,
        });
    }
    /**  字符串是否以 "$" 或者 "_" 开头 */
    function isReserved(str) {
        const c = (str + "").charCodeAt(0);
        return c === 0x24 || c === 0x5f;
    }
    /**
     * bailRe=/[^a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD.$_\d]/
     */
    const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`);
    function parsePath(path) {
        /** 也就是 path 必须是 [a-zA-Z.$_\d]  */
        if (bailRE.test(path)) {
            return;
        }
        const segments = path.split(".");
        /**
         * 在 watcher 中会调用该函数，并将 vue 实例传入
         * 其实就是访问实例属性，从而触发依赖收集
         */
        return function (vm) {
            /**
             * vm.a.b.c
             * 入口对象为 vm，
             * vm 当做普通对象看待
             */
            let obj = vm;
            for (let i = 0; i < segments.length; i++) {
                if (!obj)
                    return;
                obj = obj[segments[i]];
            }
            return obj;
        };
    }

    const ASSET_TYPES = ["component", "directive", "filter"];
    const LIFECYCLE_HOOKS = [
        "beforeCreate",
        "created",
        "beforeMount",
        "mounted",
        "beforeUpdate",
        "updated",
        "beforeDestroy",
        "destroyed",
        "activated",
        "deactivated",
        "errorCaptured",
        "serverPrefetch",
        "renderTracked",
        "renderTriggered",
    ];

    /** 在数组的原型链上插入自定义原型对象 */
    const arrayMethods = Object.create(Array.prototype);
    const methodsToPatch = [
        "push",
        "pop",
        "shift",
        "unshift",
        "splice",
        "sort",
        "reverse",
    ];
    /** 重写数组方法 */
    methodsToPatch.forEach((method) => {
        /** Array.prototype 上的函数 */
        const original = arrayMethods[method];
        def(arrayMethods, method, function mutator(...args) {
            const result = original.apply(this, args);
            const ob = this.__ob__;
            let inserted;
            switch (method) {
                case "push":
                case "unshift":
                    /**
                     * push(el1,el2,el3,...)
                     */
                    inserted = args;
                    break;
                case "splice":
                    /**
                     * splice(start, deleteCount, item1, item2, itemN)
                     *        第三项开始为插入项
                     */
                    inserted = args.slice(2);
                    break;
            }
            /** 新插入的数据需要被劫持 */
            inserted && ob.observeArray(inserted);
            ob.dep?.notify();
            return result;
        });
    });

    let uid$2 = 0;
    class Dep {
        /**
         * Dep实例是在 defineReactive() 中被创建的,
         * 为了能将 watcher实例 添加入监听列表,需要Dep 静态属性作为中转
         */
        static target;
        id;
        subs;
        constructor() {
            this.id = uid$2++;
            // console.log("dep:", this.id);
            this.subs = [];
        }
        /**
         * 收集依赖
         * 一个 watcher 对应多个 dep的情况:
         *    渲染函数: {{msg}}  {{age}}
         *  一个dep对应多个 watcher 的情况
         *    渲染函数:{{msg}}
         *    计算属性:{greet(){return this.msg + 'world'}}
         * 依赖去重:
         *    渲染函数: {{msg}} {{msg}}
         * 每次取 msg 时，dep 需要记住当前 watcher ,但是已经存在的 watcher 不需要重复 push
         * 源代码的去重是在 watcher 中进行
         *
         */
        depend() {
            if (Dep.target) {
                /**双向绑定 */
                Dep.target.addDep(this);
            }
        }
        /**通知依赖更新*/
        notify() {
            const subs = this.subs.filter((s) => s);
            if (!config.async) ;
            subs.forEach((sub) => sub.update());
        }
        /** 真正的收集依赖 */
        addSub(sub) {
            this.subs.push(sub);
            // console.log(
            //   "depId:" + this.id + " host: " + this.host + " 依赖集合: ",
            //   this.subs
            // );
        }
        /** 解除 sub 对属性的观察，以后属性的变化，不再触发 sub 的更新 */
        removeSub(sub) {
            this.subs[this.subs.indexOf(sub)] = null;
        }
    }
    Dep.target = null;
    // const targetStack: Array<DepTarget | null | undefined> = [];
    function pushTarget(target) {
        // targetStack.push(target);
        Dep.target = target;
    }
    function popTarget(target) {
        // targetStack.pop();
        // Dep.target = targetStack[targetStack.length - 1];
        Dep.target = null;
    }

    const NO_INITIAL_VALUE = {};
    function observe(value) {
        if (value && isObject(value)) {
            /** ESNEXT API*/
            if (Object.hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
                /** 已经劫持过 */
                return value.__ob__;
            }
            else {
                if ((isPlainObject(value) || Array.isArray(value)) &&
                    Object.isExtensible(value) // 需要给 value 添加 __ob__ 属性
                ) {
                    /**
                     * 使用 Object.freeze()冻结对象，使之不能扩展，也就不会进行数据观测，
                     * 对于业务上不需要观测的数据，可以提高性能 */
                    return new Observer(value);
                }
            }
        }
    }
    class Observer {
        value;
        /** 给数组使用的Dep */
        dep;
        constructor(value) {
            this.value = value;
            def(value, "__ob__", this);
            this.dep = new Dep();
            if (Array.isArray(value)) {
                if (hasProto) {
                    Object.setPrototypeOf(value, arrayMethods);
                }
                else {
                    /** arrayMethods 属性不可遍历,无法使用 Object.keys() */
                    // let keys = Object.getOwnPropertyNames(arrayMethods);
                    // let keys = Reflect.ownKeys(arrayMethods);
                    let keys = methodsToPatch;
                    keys.forEach((key) => def(value, key, arrayMethods[key]));
                }
                this.observeArray(value);
            }
            else {
                this.walk(value);
            }
        }
        walk(obj) {
            /**
             * 实例的数据必须可枚举，所以一般不用 data=Object.create(null,{...}) 来定义数据
             *  */
            Object.keys(obj).forEach((key) => {
                defineReactive(obj, key, NO_INITIAL_VALUE);
            });
        }
        /** 劫持数组元素 [{a:1}] */
        observeArray(arr) {
            arr.forEach((val) => observe(val));
        }
    }
    function defineReactive(obj, key, val) {
        /**
         * 每个属性都对应一个 Dep 实例
         * 一个 Dep 实例保存多个 Watcher 实例
         * 这个 Dep 是给 PlainObject 使用
         * 数组需要更复杂的操作
         *
         * {
         *    list:[1,2]
         * }
         * vm.list = 1 会触发 list 映射的 Dep 更新
         * 但是 vm.list.push(0) 由于没有更改 list 的值，所以不会触发 list 映射的 Dep 更新
         * 对于数组，需要给数组额外添加 Dep,当调用数组 API 时，触发该 Dep 更新
         */
        const dep = new Dep();
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        /**  由于要修改configurable,所以原始configurable不能为false */
        if (!!descriptor?.configurable === false) {
            return;
        }
        /**
         * 如果之前该对象已经预设了getter以及setter函数则将其取出来，
         * 新定义的getter/setter中会将其执行，保证不会覆盖之前已经定义的getter/setter。
         */
        const getter = descriptor?.get;
        const setter = descriptor?.set;
        if ((!getter || setter) &&
            (val === NO_INITIAL_VALUE || arguments.length === 2)) {
            val = obj[key];
        }
        /** 递归劫持子对象 */
        let childOb = observe(val);
        /**
         * template:{{age}}
         * data:{age:{a:1}}
         * 1. 获取 age 走一次 get 访问器
         * 2. 返回的结果是对象 {a:1},对象给渲染函数时，为了能在页面上展示数据，需要将对象转成字符串
         * 3. JSON.stringify({a:1}) 会遍历对象取值，从而再次进入 get 访问器()，导致 age 对应的依赖，a 也会收集
         */
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter() {
                const value = getter ? getter.call(obj) : val;
                /**
                 * {
                 *  list:[1,2]
                 * }
                 * vm.list = [3]
                 * 由于是更改对象属性，所以 list 属性映射的 Dep 会通知更新
                 *
                 * vm.list.push(3)
                 * 对于数组操作，需要给 [1,2] 数组映射一个 Dep，[1,2].dep = new Dep(),当 操作 push()时
                 * 就通过 [1,2].dep.notify()
                 */
                if (Dep.target) {
                    dep.depend();
                    if (childOb) {
                        childOb.dep.depend();
                        /**
                         * value当前值:['hello',{a:1},[1,2]],
                         * 内层数组 [1,2] 依然需要收集当前依赖
                         */
                        if (isArray(value))
                            dependArray(value);
                    }
                }
                return value;
            },
            set: function reactiveSetter(newVal) {
                const value = getter ? getter.call(obj) : val;
                if (Object.is(value, newVal)) {
                    return;
                }
                if (setter) {
                    setter.call(obj, newVal);
                }
                else if (getter) {
                    return;
                }
                else {
                    val = newVal;
                }
                /** 设置新值，需要重新劫持 */
                childOb = observe(newVal);
                dep.notify();
            },
        });
    }
    function set(target, key, val) {
        {
            if (isUndef(target) || isPrimitive(target)) {
                warn$1(`Cannot set reactive property on undefined, null, or primitive value: ${target}`);
            }
        }
        if (isArray(target)) {
            return;
        }
        if (hasOwn(target, key)) ;
        target[key] = val;
        return val;
    }
    function dependArray(val) {
        val.forEach((v) => {
            if (isArray(v)) {
                v.__ob__.dep.depend();
                dependArray(v);
            }
        });
    }

    const defaultStrat = function (parentVal, childVal) {
        return childVal === undefined ? parentVal : childVal;
    };
    const strats = config.optionMergeStrategies;
    {
        strats.el = function (parent, child, vm, key) {
            if (!vm) {
                /**
                 * 全局混入时，不能有 el 配置项
                 */
                warn$1(`option "${key}" can only be used during instance ` +
                    'creation with the `new` keyword.');
            }
            return defaultStrat(parent, child);
        };
    }
    LIFECYCLE_HOOKS.forEach((hook) => (strats[hook] = mergeLifecycleHook));
    /**生命周期合并为数组 */
    function mergeLifecycleHook(parentVal, childVal) {
        /**
         *  childVal?
         *    存在
         *      parentVal?
         *        存在 res = parentVal.concat(childVal)
         *        不存在
         *          childVal
         *              是数组 res = childVal
         *              不是   res = [childVal]
         *    不存在
         *      res = parentVal
         *
         */
        return childVal
            ? parentVal
                ? parentVal.concat(childVal)
                : isArray(childVal)
                    ? childVal
                    : [childVal]
            : parentVal;
    }
    ASSET_TYPES.forEach((type) => (strats[type + 's'] = mergeAssets));
    /** assets 使用原型链合并 */
    function mergeAssets(parentVal, childVal, vm, key) {
        let res = Object.create(parentVal || null);
        if (childVal) {
            {
                assertObjectType(key, childVal, vm);
            }
            extend(res, childVal);
        }
        return res;
    }
    strats.data = function (parentVal, childVal, vm) {
        if (!vm) {
            /**
             * 全局混入:
             * parent是 Vue.options = {components:...,filters:...} 初始时并没有 data 属性，所以 parentVal 为 undefined
             * child:是Vue.mixin(...)参数，childValue 是 data 属性的值
             *
             *
             */
            if (childVal && !isFunction(childVal)) {
                {
                    /**
                     * 全局混入的 data 必须为一个返回对象的函数
                     */
                    warn$1('The "data" option should be a function ' +
                        'that returns a per-instance value in component ' +
                        'definitions.', vm);
                }
                return parentVal;
            }
            return mergeDataOrFn(parentVal, childVal);
        }
        return mergeDataOrFn(parentVal, childVal, vm);
    };
    function mergeDataOrFn(parentVal, childVal, vm) {
        if (!vm) {
            /**
             * Vue.minxin({
             *  data:null
             * })
             * 丢弃此时 null 值，返回上次混入的 data 值
             */
            if (!childVal) {
                return parentVal;
            }
            /**
             * 第一次全局混入 data 时，原样返回
             */
            if (!parentVal) {
                return childVal;
            }
            /**
             * 第2,3,4,...次之后的全局混入 ，需要返回 mergedDataFn 函数，
             * mergedDataFn 会在 mergedInstanceDataFn() 中调用
             * 因为闭包关系，每次调用 mergedDataFn() 时， parentVal 和 childVal 为混入时的值
             * 比如 Vue.mix({data:1}) ,Vue.mixin({data:2}) Vue.mixin({data:3})
             *
             * 合并全局混入时: mergeData({data:3},mergeData({data:2},{data:1}))
             *
             */
            return function mergedDataFn() {
                return mergeData(isFunction(childVal) ? childVal.call(vm, vm) : childVal, isFunction(parentVal) ? parentVal.call(vm, vm) : parentVal);
            };
        }
        else {
            /**获取实例数据，在 initData中会调用 mergedInstanceDataFn.call(vm,vm) */
            return function mergedInstanceDataFn() {
                const instanceData = isFunction(childVal)
                    ? childVal.call(vm, vm)
                    : childVal;
                const defaultData = isFunction(parentVal)
                    ? parentVal.call(vm, vm)
                    : parentVal;
                if (instanceData) {
                    return mergeData(instanceData, defaultData);
                }
                else {
                    return defaultData;
                }
            };
        }
    }
    function mergeData(to, from, recursive = true) {
        if (!from)
            return to;
        /** 合并所有属性 Object.ownProperNames() + Object.ownPropertySymbols() */
        const keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from);
        for (let i = 0, l = keys.length; i < l; i++) {
            let key = keys[i];
            let toVal = to[key];
            let fromVal = from[key];
            if (!recursive || !hasOwn(to, key)) {
                /**
                 * from {a:1}
                 * to {b:2}
                 * 合并: to {a:1,b:2}
                 *
                 * from { [Symbol('a'):111] }
                 * to   { [Symbol('a'):222] }
                 */
                // to[key] = fromVal;
                set(to, key, fromVal);
            }
            else if (toVal != fromVal &&
                isPlainObject(toVal) &&
                isPlainObject(fromVal)) {
                /**
                 * let obj = {a:1}
                 * from {info:obj}
                 * to   {info:obj}
                 * 属性值为对象合并时，指向相同对象不需要合并
                 */
                mergeData(toVal, fromVal);
            }
            else ;
        }
        return to;
    }
    strats.computed = strats.methods = function (parentVal, childVal, vm, key) {
        if (childVal && __DEV__) {
            assertObjectType(key, childVal, vm);
        }
        if (!parentVal)
            return childVal;
        const ret = Object.create(null);
        extend(ret, parentVal);
        /** 由于是简单的对象合并，childVal 可能会覆盖 parentVal  */
        if (childVal)
            extend(ret, childVal);
        return ret;
    };
    function assertObjectType(name, value, vm) {
        if (!isPlainObject(value)) {
            warn$1(`Invalid value for option "${String(name)}": expected an Object, ` +
                `but got ${toRawType(value)}.`, vm);
        }
    }
    function checkComponents(options) {
        for (const key in options.components) {
            validateComponentName(key);
        }
    }
    function validateComponentName(name) {
        if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
            warn$1('Invalid component name: "' +
                name +
                '". Component names ' +
                'should conform to valid custom element name in html5 specification.');
        }
        /**
         * 组件名称不能是 slot,component
         * 组件名称不能是 html 标签，svg 标签
         */
        if (isBuiltInTag(name) || config.isReservedTag(name)) {
            warn$1('Do not use built-in or reserved HTML elements as component ' +
                'id: ' +
                name);
        }
    }
    function mergeOptions(parent, child, vm) {
        /** 如果配置了组件，检查组件名是否合法 */
        {
            checkComponents(child);
        }
        /**
         * child 参数为 Vue 子类
         * 子类 options 会和父类 options 合并
         *
         */
        if (isFunction(child) && Reflect.has(child, 'cid')) {
            child = child.options;
        }
        let option = {};
        /**合并 parent 和 child 公有的 Key  */
        for (let key in parent) {
            mergeField(key);
        }
        for (let key in child) {
            /**合并 child 独有的key */
            if (!hasOwn(parent, key)) {
                mergeField(key);
            }
        }
        function mergeField(key) {
            /**不同的 Key,采用不同合并策略 */
            let strat = strats[key] || defaultStrat;
            option[key] = strat(parent[key], child[key], vm, key);
        }
        return option;
    }
    /**
     * 在 实例的 $options 上寻找特定资源的定义,全局配置的资源已经合并到实例 $options 上
     * instance[type][id]
     */
    function resolveAsset(options, type, id, warnMissing) {
        if (typeof id !== 'string')
            return;
        const assets = options[type];
        if (assets) {
            if (Object.hasOwn(assets, id)) {
                return assets[id];
            }
            /** hello-world => helloWorld */
            const camelizedId = camelize(id);
            if (Object.hasOwn(assets, camelizedId)) {
                return assets[camelizedId];
            }
            /** helloWorld => HelloWorld */
            const PascalCaseId = capitalize(camelizedId);
            if (Object.hasOwn(assets, PascalCaseId)) {
                return assets[PascalCaseId];
            }
            /** assets 本身没有找到，则去原型链上找 */
            const res = assets[id];
            if (warnMissing && !res) {
                /** 未找到资源 */
                warn$1('Failed to resolve ' + type.slice(0, -1) + ': ' + id);
            }
            return res;
        }
        return;
    }

    // @ts-expect-error firebox support
    const nativeWatch = {}.watch;
    const hasProto = "__proto__" in {};
    const inBrowser = typeof window !== "undefined";
    const UA = inBrowser && window.navigator.userAgent.toLowerCase();
    const isIE = UA && /msie|trident/.test(UA);
    const isIOS = UA && /iphone|ipad|ipod|ios/.test(UA);
    /** 浏览器内部函数 */
    function isNative(Ctor) {
        return typeof Ctor === "function" && /native code/.test(Ctor.toString());
    }
    /** Reflect.ownKeys = 所有字符串属性 + 所有 symbol 属性 */
    const hasSymbol = typeof Symbol !== "undefined" &&
        isNative(Symbol) &&
        typeof Reflect !== "undefined" &&
        isNative(Reflect.ownKeys);
    let _Set;
    if (typeof Set !== "undefined" && isNative(Set)) {
        _Set = Set;
    }
    else {
        _Set = class Set {
            set = Object.create(null);
            has(key) {
                return this.set[key];
            }
            add(key) {
                this.set[key] = true;
            }
            clear() {
                this.set = Object.create(null);
            }
        };
    }
    let _isServer;
    const isServerRendering = () => {
        if (_isServer === undefined) {
            if (!inBrowser && typeof global !== "undefined") {
                _isServer =
                    global["process"] && global["process"].env.VUE_ENV === "server";
            }
            else {
                _isServer = false;
            }
        }
        return _isServer;
    };

    const callbacks = [];
    let pending = false;
    let timerFunc;
    if (typeof Promise !== "undefined" && isNative(Promise)) {
        timerFunc = () => {
            /** 将 flushCallbacks 注册为微任务,当所有数据完成更新后(同步代码)会立即执行微任务 */
            Promise.resolve().then(flushCallbacks);
            if (isIOS) {
                /**
                 * BUG: ios 中宏任务执行完毕，如果宏任务队列已经空了，
                 * 不会立即执行微任务，那么就再注册一个宏任务，强制浏览器执行新的宏任务前，把上次的微任务执行掉 */
                setTimeout(noop);
            }
        };
    }
    else if (!isIE &&
        typeof MutationObserver !== "undefined" &&
        (isNative(MutationObserver) ||
            MutationObserver.toString() === "[object MutationObserverConstructor]")) {
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
    }
    else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
        timerFunc = () => {
            /** setImmediate 是一个宏任务 ,仅 IE 支持 */
            setImmediate(flushCallbacks);
        };
    }
    else {
        timerFunc = () => {
            /**
             * setTimeout 在计时结束前，会不停地查看有没有达到指定时间，
             * 达到指定时间则将 flushCallbacks注册进宏任务队列中
             * 所以有性能问题
             */
            setTimeout(flushCallbacks, 0);
        };
    }
    function nextTick(cb, ctx) {
        let _resolve;
        /**
         * callbacks 中并不是直接添加 cb，而是添加一个执行 cb 的匿名函数,
         * 并且如果直接添加 callbacks.push(cb),在 flushCallbacks 中执行 cb() 时，丢失 this 指向 ctx 的要求
         */
        callbacks.push(() => {
            if (cb) {
                try {
                    /** this 闭包引用 ctx */
                    cb.call(ctx);
                }
                catch (e) { }
            }
            else if (_resolve) {
                /** 如果没有 cb ,则调用 Promise 的resolve,这样 promise 对象的状态为 fullfilled,状态值为 ctx */
                _resolve(ctx);
            }
        });
        /**
         * created() {
         *      this.$nextTick(() => {
         *        console.log(1);
         *      });
         *      this.$nextTick(() => {
         *        console.log(2);
         *      });
         *      this.$nextTick(() => {
         *        console.log(3);
         *      });
         * },
         * 1.callbacks 注册 fn1,此时 pending 为 false,进入 if 分支，pending 设为 true,注册一个异步任务
         * 2.callbacks 注册 fn2,此时 pending 为 true,跳过 if 分支
         * 3.callbacks 注册 fn3,此时 pending 为 true,跳过 if 分支
         * 4.created 执行完毕,执行后续的 vue 代码，执行完毕，调用栈已经清空，开始执行异步任务 flushCallbacks
         * 5.按顺序执行 fn1,fn2,fn3,同时 pending 设置为 false
         * 6.当 flushCallbacks执 行完毕后，表示异步任务结束，等待下一次更新
         */
        if (!pending) {
            /**
             * 回调队列等待执行，此时仍然可以向 callbacks 中添加回调，但添加的回调应该在同一个异步任务中，
             * 所以 pending 防止在等待异步队列开始执行前，又开启了一个一步任务
             */
            pending = true;
            /**
             *  注册一个异步任务，该异步任务会等待调用栈清空后再执行
             */
            timerFunc();
        }
        if (!cb && typeof Promise !== "undefined") {
            return new Promise((resolve) => {
                _resolve = resolve;
            });
        }
    }
    /**
     * 如果 flushCallbacks 是直接遍历 callbacks
     * function flushCallbacks() {
     *    pending = false;
     *    for (let i = 0; i < callbacks.length; i++) {
     *      callbacks[i]();
     *    }
     *    callbacks.length = 0;
     * }


     * created() {
     *      this.$nextTick(function fn1() {
     *          console.log(1);
     *          this.$nextTick(function fn2() {
     *            console.log(2);
     *          });
     *      });
     *  },
     * 1.callbacks 注册 fn1,同时创建微任务 m1
     * 2.调用栈清空，开始执行微任务 m1
     * 3.执行 flushCallbacks,遍历执行 callbacks，也就是执行 fn1
     * 4.fn1中输出 1，然后又遇到了 $nextTick
     * 5.由于当前处于 for 循环中,  callbacks.length = 0;还未执行, callbacks 又注册了 fn2,当前 callbacks 内容为 [fn1,fn2]
     * 6.pending 已经为 false，所以在当前微任务 m1 执行时又创建了新的微任务 m2
     * 7.fn1中 $nextTick 执行完毕,fn1执行完毕，i++
     * 8.执行 callbacks 中第二个函数 fn2
     * 9.fn2执行完毕，for 循环结束,callbacks 清空
     * 10.微任务 m1 执行完毕，开始执行微任务 m2
     * 11.执行 flushCallbacks ,但 callbacks 长度为 0
     *
     * a.对于两次 $nextTick 应该创建两个微任务
     * b.fn1 应该在微任务 m1 中执行，fn2 应该在 m2 中执行,也就是在执行 m1 时，应该遍历 m1 时注册的回调
     * c.执行微任务m1时,备份 m1 时注册的回调，并清空 callbacks，这样在注册 m2 时，callbacks 中仅有 m2 时的回调
     */
    function flushCallbacks() {
        pending = false;
        const copies = callbacks.slice(0);
        callbacks.length = 0;
        for (let i = 0; i < copies.length; i++) {
            copies[i]();
        }
    }

    function initMixin$1(Vue) {
        /**
         * Vue.options = Object.create(null);
         * 将 mixin 合并到 Vue.options 上
         * @param mixin
         * @returns
         */
        Vue.mixin = function (mixin) {
            this.options = mergeOptions(this.options, mixin);
            return this;
        };
    }

    function initAssetRegisters(Vue) {
        /**
         * Vue.directive
         * Vue.component
         * Vue.filter
         */
        ASSET_TYPES.forEach((type) => {
            Vue[type] = function (id, definition) {
                if (!definition) {
                    return Vue.options[type + "s"][id];
                }
                else {
                    if (type === "component") {
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
                    }
                    this.options[type + "s"][id] = definition;
                    /** 返回 Vue 子类 */
                    return definition;
                }
            };
        });
    }

    class VNode {
        tag;
        data;
        children;
        text;
        elm;
        ns;
        context;
        componentOptions;
        key;
        /**
         * <hello><div></div></hello>
         */
        /**
         * hello 标签会创建一个 componentVNode
         * 由于 hello 是组件，根据 componentOptions 创建一个组件实例 componentInstance
         *
         * componentInstance 的 parent 是 <hello>组件所在的组件
         *
         */
        componentInstance;
        /**
         * hello 标签对应一个 componentVNode
         * 它下面的 div 会创建 divVNode
         *
         * divVNode.parent == componentVNode
         */
        parent;
        isComment;
        isRootInsert;
        constructor(tag, data, children, text, elm, context, componentOptions) {
            this.tag = tag;
            this.data = data;
            this.children = children;
            this.text = text;
            this.elm = elm;
            this.ns = void 0;
            this.key = data && data.key;
            this.context = context;
            this.componentOptions = componentOptions;
            this.parent = undefined;
            this.isComment = false;
            this.isRootInsert = true;
        }
    }

    const watcherSet = new _Set();
    const queue = [];
    let has = {};
    let waiting = false;
    /**
     * 将不同 watcher 加入 queue 队列，设定一个微任务来遍历 queue，实现延迟批量处理更新功能
     */
    function queueWatcher(watcher) {
        const id = watcher.id;
        if (watcherSet.has(id)) {
            return;
        }
        if (has[id] != null) {
            has[id] = true;
            {
                queue.push(watcher);
            }
            if (!waiting) {
                waiting = true;
                if (!config.async) ;
                nextTick(flushSchedulerQueue);
            }
        }
        nextTick(flushSchedulerQueue);
    }
    function flushSchedulerQueue() {
        queue.forEach((watcher) => watcher.run());
        queue.length = 0;
        watcherSet.clear();
    }

    let uid$1 = 0;
    class Watcher {
        vm;
        /**uid号 */
        id;
        /**原始表达式,方便观察 watcher 的来源 */
        expression;
        /**数据变化后的回调函数 */
        cb;
        /** 是否立即获取数据 */
        lazy;
        /** 是否深度观测 */
        deep;
        /** 当前 watcher 是用户定义的还是 Vue 内部定义的(渲染函数 watcher 和计算属性 watcher) */
        user;
        /** 当数据变化时是否同步求值，默认是异步等待所有数据变化结束后统一求值 */
        sync;
        dirty;
        /** 当前 watcher 是否为激活状态，默认 true，可在 teardown() 中设为 false */
        active;
        /** 数据变化后，在更新之前调用该钩子 */
        before;
        /**取值函数 */
        getter;
        depIds;
        newDepIds;
        deps;
        newDeps;
        value;
        constructor(vm, expOrFn, cb, options, isRenderWatcher) {
            this.vm = vm;
            if (vm && isRenderWatcher) {
                /**渲染函数的 watcher  */
                vm._watcher = this;
            }
            vm._watchers.push(this);
            if (options) {
                this.lazy = !!options.lazy;
                this.deep = !!options.deep;
                this.user = !!options.user;
                this.sync = !!options.sync;
                this.before = options.before;
            }
            else {
                this.lazy = false;
                this.deep = false;
                this.user = false;
                this.sync = false;
            }
            this.id = ++uid$1;
            this.cb = cb;
            this.dirty = this.lazy;
            this.active = true;
            // console.log("watcher:", this.id);
            this.deps = [];
            this.depIds = new _Set();
            this.newDeps = [];
            this.newDepIds = new _Set();
            this.expression = expOrFn.toString() ;
            if (isFunction(expOrFn)) {
                this.getter = expOrFn;
            }
            else {
                this.getter = parsePath(expOrFn);
                if (!this.getter) {
                    /**  expOrFn 字符串时非法字符*/
                    this.getter = noop;
                    warn$1(`Failed watching path: "${expOrFn}" ` +
                            'Watcher only accepts simple dot-delimited paths. ' +
                            'For full control, use a function instead.', vm);
                }
            }
            this.value = this.lazy ? undefined : this.get();
        }
        get() {
            // console.log("watcher get");
            pushTarget(this);
            let value;
            /**
             * watch:{
             *  "f.g.h":function(){....}
             * }
             * vm 是给字符串形式的 expOrFn 用的
             */
            const vm = this.vm;
            /**
             * 执行getter(),在 getter 中如果需要访问 vm 数据则会触发数据的 getter 访问器
             * 由于已经pushTarget(this)，Dep.target 指向当前 watcher 实例
             * 在 getter 访问器中通过 Dep.target 拿到 watcher 实例
             * 将 watcher 实例 push()到 Dep 中，完成依赖收集
             * 以后每次 vm 属性值发生改变时,遍历 Dep 保存的 watcher 实例数组，从而实现更新
             *
             */
            try {
                value = this.getter.call(vm, vm);
            }
            catch (e) {
            }
            finally {
                popTarget();
                this.cleanupDeps();
            }
            return value;
        }
        addDep(dep) {
            const id = dep.id;
            /**
             * 通过 newDepIds 避免重复收集依赖
             * {{name}} {{name}} 触发两次 getter => 触发两次 dep.depend() => 触发两次 addDep()
             */
            if (!this.newDepIds.has(id)) {
                this.newDepIds.add(id);
                this.newDeps.push(dep);
                // if (!this.depIds.has(id)) {
                //   dep.addSub(this);
                // }
                dep.addSub(this);
            }
        }
        cleanupDeps() { }
        update() {
            if (this.lazy) ;
            else if (this.sync) ;
            else {
                /**
                 * 将更新放到异步队列中
                 */
                queueWatcher(this);
            }
        }
        run() {
            if (this.active) ;
        }
        evaluate() {
            this.value = this.get();
            this.dirty = false;
        }
        depend() { }
        teardown() {
            if (this.active) {
                let i = this.deps.length;
                while (i--) {
                    this.deps[i].removeSub(this);
                }
                this.active = false;
            }
        }
    }

    function invokeWithErrorHandling(handler, context, args) {
        let res;
        try {
            res = args ? handler.apply(context, args) : handler.call(context);
        }
        catch (e) { }
        return res;
    }

    function createEmptyVNode(text = "") {
        const vnode = new VNode();
        vnode.isComment = true;
        vnode.text = text;
        return vnode;
    }

    let activeInstance = null;
    function setActiveInstance(vm) {
        const prevActiveInstance = activeInstance;
        activeInstance = vm;
        return () => {
            activeInstance = prevActiveInstance;
        };
    }
    function lifecycleMixin(Vue) {
        /**将虚拟DOM，生成真实DOM */
        Vue.prototype._update = function (vnode) {
            const vm = this;
            // const prevEl = vm.$el;
            const prevVnode = vm._vnode;
            vm._vnode = vnode;
            const restoreActiveInstance = setActiveInstance(vm);
            if (!prevVnode) {
                /**
                 * 没有 prevVnode 说明是第一次渲染,vm.$el 为 HtmlElemtn
                 */
                vm.$el = vm.__patch__(vm.$el, vnode);
            }
            else {
                /** prevVnode 存在,说明是更新操作 */
                vm.$el = vm.__patch__(prevVnode, vnode);
            }
            restoreActiveInstance();
        };
    }
    function initLifecycle(vm) {
        vm._isMounted = false;
        vm._watcher = null;
    }
    function mountComponent(vm, el) {
        /**
         * vm.$el 初次挂载时指向将要被替换的 DOM 元素,
         * 但是挂载完成后 vm.$el 将在 _update() 中被替换为组件的根元素
         *
         */
        vm.$el = el;
        /**
         * 如果是 runtime+compiler 版本，一定有 render 函数
         * 当 runtime 版本时，不提供 render 函数，则需要报错
         */
        if (!vm.$options.render) {
            /**为了渲染时不报错，提供一个空的VNode */
            //@ts-expect-error
            vm.$options.render = createEmptyVNode;
            {
                if ((vm.$options.template &&
                    String(vm.$options.template).charAt(0) != '#') ||
                    vm.$options.el ||
                    el) {
                    /**
                     * runtime 版本且未提供 render
                     *  1. new Vue({}).$mount('#app)
                     *  2. new Vue({el:"#app"}).$mount('')
                     */
                    warn$1('You are using the runtime-only build of Vue where the template ' +
                        'compiler is not available. Either pre-compile the templates into ' +
                        'render functions, or use the compiler-included build.', vm);
                }
                else {
                    /**
                     * runtime 版本且未提供 render
                     * new Vue({}).$mount('')
                     */
                    warn$1('Failed to mount component: template or render function not defined.', vm);
                }
            }
        }
        callHook(vm, 'beforeMount');
        const updateComponent = () => {
            vm._update(vm._render());
        };
        const watcherOptions = {
            /** 每次更新前调用 before() */
            before() {
                if (vm._isMounted && !vm._isDestroyed) {
                    callHook(vm, 'beforeUpdate');
                }
            },
        };
        /**
         * 渲染 watcher,每个组件都有一个渲染 watcher,watcher 内部会调用 updateComponent()
         * updateComponent() 又会调用 vm._render(),
         * vm._render()的执行将触发数据属性的 getter 拦截器，从将依赖者(watcher) 收集
         * 当数据变化时，重新执行 updateComponent(),这就完成了重新渲染
         */
        new Watcher(vm, updateComponent, noop, watcherOptions, true);
        /**挂载完成后，vm.$el 更新为最新元素 */
        callHook(vm, 'mounted');
        vm._isMounted = true;
        return vm;
    }
    function callHook(vm, hook, args) {
        // const info = `${hook} hook`;
        const handlers = vm.$options[hook];
        if (handlers) {
            for (let i = 0, j = handlers.length; i < j; i++) {
                invokeWithErrorHandling(handlers[i], vm);
            }
        }
    }

    const componentVNodeHooks = {
        init(vnode) {
            const child = (vnode.componentInstance = createComponentInstanceForVnode(vnode, activeInstance));
            if (child) {
                /**
                 *  需要挂载，在挂载过程中,vm.$el = path(...),实例获得真实DOM元素
                 *  也就是 vnode.componentInstance.$el 就被赋值了 */
                child.$mount();
            }
        },
    };
    const hooksToMerge = Object.keys(componentVNodeHooks);
    function installComponentHooks(data) {
        const hooks = data.hook || (data.hook = {});
        hooksToMerge.forEach((key) => {
            const existing = hooks[key];
            const toMerge = componentVNodeHooks[key];
            /**
             * existing 不存在，则返回 toMerge
             * existing 存在
             *    和 toMerge 相等
             *        已经合并过 无操作
             *        未合并过   合并
             *    和 toMerge 不相等，合并
             */
            if (existing != toMerge || !(existing && existing._merged)) {
                hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge;
            }
        });
    }
    function mergeHook(f1, f2) {
        const merged = function (a, b) {
            f1(a, b);
            f2(a, b);
        };
        merged._merged = true;
        return merged;
    }
    function getComponentName(options) {
        if (typeof options === "function") {
            return options.name;
        }
        else {
            return options.name || options.__name || options._componentTag;
        }
    }
    function createComponent(Ctor, data, context, children, tag) {
        let VueComponent;
        if (isUndef(Ctor))
            return;
        const baseCtor = context.$options._base;
        /** 如果是组件配置选项，则调用 Vue.extend()转成 Vue 子类 */
        if (isPlainObject(Ctor)) {
            VueComponent = baseCtor.extend(Ctor);
        }
        else {
            VueComponent = Ctor;
        }
        /**
         * 组件配置选项无效
         * components:{
         *    hello:111
         * }
         */
        if (!isFunction(VueComponent)) {
            {
                warn$1(`Invalid Component definition: ${String(Ctor)}`, context);
            }
            return;
        }
        var name = getComponentName(VueComponent.options) || tag;
        data = data || {};
        /** 绑定一些钩子函数 */
        installComponentHooks(data);
        /** vue-component-1-counter */
        const vnode = new VNode(`vue-component-${VueComponent.cid}${name ? `-${name}` : ""}`, data, undefined, undefined, undefined, context, {
            Ctor: VueComponent,
            tag,
            propsData: undefined,
            listeners: undefined,
            children,
        });
        return vnode;
    }
    function createComponentInstanceForVnode(vnode, parent) {
        if (vnode.componentOptions) {
            const options = {
                _isComponent: true,
                _parentVnode: vnode,
                parent,
            };
            return new vnode.componentOptions.Ctor(options);
        }
    }

    function initExtend(Vue) {
        Vue.cid = 0;
        /**
         * cid:constructor id
         * 组件复用时，区分组件
         * <hello></hello>
         * <hello></hello>
         */
        let cid = 1;
        /**
         * extendOptions类似 componentOptions，但 不包含 el 配置.el 是实例上的配置
         * extendOptions还可以是 Vue 类或者子类
         *
         */
        Vue.extend = function (extendOptions) {
            extendOptions = extendOptions || {};
            const Super = this;
            // const SuperId = Super.cid;
            const name = getComponentName(extendOptions) || getComponentName(Super.options);
            /** Vue 子类 */
            const Sub = function VueComponent(options) {
                this._init(options);
            };
            // Sub.prototype = Object.create(Super.prototype);
            // Sub.prototype.constructor = Sub;
            Object.setPrototypeOf(Sub.prototype, Super.prototype);
            Sub.cid = cid++;
            /**
             * 类似于 Vue.options 会被合并到 vue 实例上
             * Sub.options 合并所有父类的 options 和用户 options
             * Sub.options最终在创建 Sub 实例是，被合并到 Sub 类的实例的 $options 上
             */
            Sub.options = mergeOptions(Super.options, extendOptions);
            Sub["super"] = Super;
            if (name) {
                Sub.options.components = Sub.options.components || {};
                Sub.options.components[name] = Sub;
            }
            Sub.extend = Super.extend;
            return Sub;
        };
    }

    var KeepAlive = {
        name: "keep-alive",
    };

    var builtInComponents = {
        KeepAlive,
    };

    function initGlobalAPI(Vue) {
        const configDef = {};
        configDef.get = () => config;
        {
            configDef.set = () => {
                warn$1("Do not replace the Vue.config object, set individual fields instead.");
            };
        }
        /**Vue 全局配置 */
        Object.defineProperty(Vue, "config", configDef);
        Vue.util = {
            warn: warn$1,
            extend,
            mergeOptions,
            defineReactive,
        };
        Vue.options = Object.create(null);
        /**
         * Vue.options.components = {}
         * Vue.options.filters = {}
         * Vue.options.directives = {}
         *
         */
        ASSET_TYPES.forEach((type) => {
            Vue.options[type + "s"] = Object.create(null);
        });
        /** _base 会被合并到所有 instance.$options 中 */
        Vue.options._base = Vue;
        Vue.nextTick = nextTick;
        extend(Vue.options.components, builtInComponents);
        initMixin$1(Vue);
        initExtend(Vue);
        initAssetRegisters(Vue);
    }

    function stateMixin(Vue) {
        const dataDef = {
            get() {
                return this._data;
            },
        };
        {
            dataDef.set = function () {
                warn$1('Avoid replacing instance root $data. ' +
                    'Use nested data properties instead.', this);
            };
        }
        /** 访问 $data 就是访问 _data, _data 已经经过响应式处理 */
        Object.defineProperty(Vue.prototype, '$data', dataDef);
        Vue.prototype.$watch = function (expOrFn, cb, options) {
            const vm = this;
            /**
             * cb 除了是函数还可能是一个对象,该对象的 handler 属性值将作为 cb 的值
             * {
             *    handler:function (newVal, oldVal) {...}
             *    deep:true
             * }
             */
            if (isPlainObject(cb)) {
                return createWatcher(vm, expOrFn, cb, options);
            }
            options = options || {};
            options.user = true;
            const watcher = new Watcher(vm, expOrFn, cb, options);
            /**
             * 立即取一次值，然后执行回调
             * 由于第一次没有oldVal，所以回调参数为 cb(undefined,newVal)
             *
             */
            if (options.immediate) ;
            return function unwatchFn() {
                watcher.teardown();
            };
        };
    }
    function initState(vm) {
        vm._watchers = [];
        const opts = vm.$options;
        if (opts.props) ;
        if (opts.data) {
            initData(vm);
        }
        else {
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
    function initData(vm) {
        let d = vm.$options.data;
        /** 获得对象类型数据 */
        let data = isFunction(d) ? getData(d, vm) : d || {};
        vm._data = data;
        if (!isPlainObject(data)) {
            data = {};
            warn$1('data functions should return an  object:\n' +
                    'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function', vm);
        }
        const props = vm.$options.props;
        const methods = vm.$options.methods;
        Object.keys(data).forEach((key) => {
            if (methods && Object.hasOwn(methods, key)) {
                console.warn(`Method "${key}" has already been defined as a data property.`);
            }
            if (props && Object.hasOwn(props, key)) {
                console.warn(`The data property "${key}" is already declared as a prop. ` +
                    `Use prop default value instead.`);
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
                proxy(vm, '_data', key);
            }
        });
        /** 劫持数据 */
        observe(data);
    }
    function initMethods(vm, methods) {
        let props = vm.$options.props;
        for (let key in methods) {
            {
                if (typeof methods[key] !== 'function') {
                    warn$1(`Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
                        `Did you reference the function correctly?`, vm);
                }
                if (props && hasOwn(props, key)) {
                    warn$1(`Method "${key}" has already been defined as a prop.`, vm);
                }
                if (key in vm && isReserved(key)) {
                    warn$1(`Method "${key}" conflicts with an existing Vue instance method. ` +
                        `Avoid defining component methods that start with _ or $.`);
                }
            }
            vm[key] = typeof methods[key] !== 'function' ? noop : methods[key].bind(vm);
        }
    }
    /** lazy 计算属性的 watcher 不会立即执行 getter 操作 */
    const computedWatcherOptions = { lazy: true };
    function initComputed(vm, computed) {
        console.log(computed);
        const watchers = (vm._computedWatchers = Object.create(null));
        /** 服务端渲染  */
        const isSSR = isServerRendering();
        for (let key in computed) {
            const userDef = computed[key];
            const getter = isFunction(userDef) ? userDef : userDef.get;
            if (getter == null) {
                warn$1(`Getter is missing for computed property "${key}".`, vm);
            }
            if (!isSSR) {
                /** 保存计算属性的 watcher 到 vm._computedWatchers 上 */
                watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);
            }
            if (!(key in vm)) {
                /** 将计算属性映射到 vue 实例上 */
                defineComputed(vm, key, userDef);
            }
            else {
                if (key in vm.$data) {
                    warn$1(`The computed property "${key}" is already defined in data.`, vm);
                }
                else if (vm.$options.props && key in vm.$options.props) {
                    warn$1(`The computed property "${key}" is already defined as a prop.`, vm);
                }
                else if (vm.$options.methods && key in vm.$options.methods) {
                    warn$1(`The computed property "${key}" is already defined as a method.`, vm);
                }
            }
        }
    }
    function initWatch(vm, watch) {
        for (let key in watch) {
            const handler = watch[key];
            if (isArray(handler)) ;
            else {
                createWatcher(vm, key, handler);
            }
        }
    }
    // this 指向 Vue 实例,可以拿到 props 属性
    function getData(data, vm) {
        try {
            return data.call(vm, vm);
        }
        catch (e) {
            console.error('[Vue warn]' + e);
            return {};
        }
    }
    function proxy(target, sourceKey, key) {
        /** 源码是在全局定义 sharedPropertyDefinition */
        const sharedPropertyDefinition = {
            enumerable: true,
            configurable: true,
            get: function proxyGetter() {
                return this[sourceKey][key];
            },
            set: function (val) {
                this[sourceKey][key] = val;
            },
        };
        Object.defineProperty(target, key, sharedPropertyDefinition);
    }
    function defineComputed(target, key, userDef) {
        const shouldCache = !isServerRendering(); // true
        const sharedPropertyDefinition = {
            enumerable: true,
            configurable: true,
            get: noop,
            set: noop,
        };
        if (isFunction(userDef)) {
            /**
             * 计算属性值为一个函数，则这个函数就是 getter 访问器,getter 访问器会在 watcher 中被调用
             * computed:{
             *  full(){
             *    return 'hello'
             *  }
             * }
             */
            sharedPropertyDefinition.get = shouldCache
                ? createComputedGetter(key)
                : createGetterInvoker(userDef);
        }
        else {
            /**
             * 计算属性值为一个对象时
             * computed:{
             *    full:{
             *      get(){},
             *      set(val){}
             *    }
             * }
             * 表达式:undefined !== false 结果为 true
             */
            sharedPropertyDefinition.get = userDef.get
                ? shouldCache && userDef.cache !== false
                    ? createComputedGetter(key)
                    : createGetterInvoker(userDef.get)
                : noop;
            sharedPropertyDefinition.set = userDef.set || noop;
        }
        /** 未设置 set 访问器且调用 set 访问器时，报错 */
        if (sharedPropertyDefinition.set === noop) {
            sharedPropertyDefinition.set = function () {
                warn$1(`Computed property "${key}" was assigned to but it has no setter.`, this);
            };
        }
        /** 将计算属性映射到 vm 实例上 */
        Object.defineProperty(target, key, sharedPropertyDefinition);
    }
    /**
     *
     * 由于需要使用缓存功能，则通过 key 在 vm._computedWatchers 找到对应的 watcher，
     * 获取 watcher 的 value 值
     */
    function createComputedGetter(key) {
        return function computedGetter() {
            const watcher = this._computedWatchers && this._computedWatchers[key];
            if (watcher) {
                if (watcher.dirty) {
                    watcher.evaluate();
                }
                if (Dep.target) {
                    watcher.depend();
                }
                return watcher.value;
            }
        };
    }
    /** 服务端不需要缓存，直接调用 getter 访问器 */
    // 高阶函数:参数为函数或者返回值为函数
    function createGetterInvoker(fn) {
        return function computedGetter() {
            return fn.call(this, this);
        };
    }
    function createWatcher(vm, expOrFn, handler, options) {
        return vm.$watch(expOrFn, handler, options);
    }

    function createTextVNode(val) {
        return new VNode(undefined, undefined, undefined, String(val));
    }

    /**
     * 模版:
     * <p id="para" class="foo" v-bind:[attributename]="apple">I'm fruit</p>
     * 渲染函数:
     * "with(this){
     * return _c(
     *      'div',
     *      {attrs:{"id":"app"}},
     *      [
     *          _c(
     *              'p',
     *              _b(
     *                  {staticClass:"foo",attrs:{"id":"para"}},
     *                  "p",
     *                  _d({},[attributename,apple])
     *              ),
     *              [
     *                  _v("I'm fruit")
     *              ]
     *          )
     *      ]
     *  )
     * }"
     */
    /**
     * baseObj:{}
     * values:['hello','Apple']
     * 返回 {hello:'Apple'}
     */
    function bindDynamicKeys(baseObj, values) {
        /** 数组每两项为一个组数据{key:value} */
        for (let i = 0; i < values.length; i += 2) {
            const key = values[i];
            if (typeof key === "string" && key) {
                baseObj[key] = values[i + 1];
            }
            else if (key !== "" && key !== null) {
                warn$1(`Invalid value for dynamic directive argument (expected string or null): ${key}`, this);
            }
        }
        return baseObj;
    }

    /**
     * 模版:
     * <p id="para" class="foo" v-bind:[attributename]="apple">I'm fruit</p>
     * 渲染函数:
     * "with(this){
     * return _c(
     *      'div',
     *      {attrs:{"id":"app"}},
     *      [
     *          _c(
     *              'p',
     *              _b(
     *                  {staticClass:"foo",attrs:{"id":"para"}},
     *                  "p",
     *                  _d({},[attributename,apple])
     *              ),
     *              [
     *                  _v("I'm fruit")
     *              ]
     *          )
     *      ]
     *  )
     * }"
     */
    function bindObjectProps(data, tag, value, asProp, isSync) {
        if (value) {
            if (!isObject(value)) {
                warn$1("v-bind without argument expects an Object or Array value", this);
            }
            else {
                if (isArray(value)) {
                    value = toObject(value);
                }
                let hash;
                for (const key in value) {
                    if (key === "class" || key === "style" || isReservedAttribute(key)) {
                        hash = data;
                    }
                    else {
                        const type = data.attrs && data.attrs.type;
                        hash =
                            asProp || config.mustUseProp(tag, type, key)
                                ? data.domProps || (data.domProps = {})
                                : data.attrs || (data.attrs = {});
                    }
                    /** key:hello-world ,在 hash 中寻找是否有属性名 helloWorld*/
                    const camelizedKey = camelize(key);
                    /** key:hello-world,在 hash 中寻找是否有属性名 helloWorld */
                    const hyphenatedKey = hyphenate(key);
                    /** 普通属性 hello 转换还是 hello */
                    if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
                        hash[key] = value[key];
                    }
                }
            }
        }
        return data;
    }

    function installRenderHelpers(target) {
        target._v = createTextVNode;
        target._s = toString;
        target._d = bindDynamicKeys;
        target._b = bindObjectProps;
    }

    function createElement$1(context, tag, data, children) {
        /**
         * render:(h)=>h('div','hello') 没有 data 时
         */
        if (Array.isArray(data) || isPrimitive(data)) {
            children = data;
            data = undefined;
        }
        return _createElement(context, tag, data, children);
    }
    function _createElement(context, tag, data, children) {
        /**render:(h)=>h('') */
        if (!tag) {
            return createEmptyVNode();
        }
        let vnode;
        /**
         * tag 为字符串时有两种形式:
         * <div>hello</div>
         * <counter></counter>
         */
        if (typeof tag === "string") {
            if (config.isReservedTag(tag)) {
                /** 普通 html 标签 */
                vnode = new VNode(tag, data, children, undefined, undefined, context);
            }
            else {
                /** 获取组件构造函数 */
                let Ctor = resolveAsset(context.$options, "components", tag);
                if (Ctor) {
                    vnode = createComponent(Ctor, data, context, children, tag);
                }
            }
        }
        if (isDef(vnode)) {
            return vnode;
        }
        else {
            return createEmptyVNode();
        }
    }

    function renderMixin(Vue) {
        installRenderHelpers(Vue.prototype);
        /**执行渲染函数，生成虚拟DOM VNode */
        Vue.prototype._render = function () {
            const vm = this;
            const { render, _parentVnode } = vm.$options;
            vm.$vnode = _parentVnode;
            // console.log(render);
            let vnode;
            /**在调用render之前，如果render为undefined,mountComponent 中会给 render 赋值 */
            vnode = render.call(vm, vm.$createElement);
            // console.log(vnode);
            /**
             * template: "<script>ss</" + "script>"时，渲染函数返回 null
             */
            if (!(vnode instanceof VNode)) {
                if (isArray(vnode)) {
                    warn$1('Multiple root nodes returned from render function. Render function ' +
                        'should return a single root node.', vm);
                }
                vnode = createEmptyVNode();
            }
            /**
             *  Vue.component("hello", {
             *    template: "<div>hello</div>",
             *   }
             * );
             *
             * vnode 指向 div 产生的VNode
             * _parentVnode 指向 hello 产生的 VNode
             *
             */
            vnode.parent = _parentVnode;
            return vnode;
        };
        Vue.prototype.$nextTick = function (fn) {
            return nextTick(fn, this);
        };
    }
    function initRender(vm) {
        vm._vnode = null;
        // const options = vm.$options;
        // const parentVnode = (vm.$vnode = options._parentVnode);
        vm._c = (tag, data, children) => createElement$1(vm, tag, data, children);
        vm.$createElement = (tag, data, children) => createElement$1(vm, tag, data, children);
    }

    /** uid: vue 实例 唯一ID  */
    let uid = 0;
    function initMixin(Vue) {
        Vue.prototype._init = function (options) {
            const vm = this;
            this._uid = uid++;
            /** 在响应系统重，避免在 vue 实例上添加响应式数据*/
            vm._isVue = true;
            /** 在响应系统中，避免 vue 实例被观测 */
            vm.__v_skip = true;
            if (options && options._isComponent) {
                /** 创建自定义组件实例时，选项中有 _isComponent */
                initInternalComponent(vm, options);
            }
            else {
                /**
                 * 不能直接传参 Vue.options，
                 * 因为 vm 有可能是 Vue 的子类的实例
                 * const Sub = Vue.extend({});
                 * const s = new Sub()
                 *
                 * 我们需要获取构造函数上的 options ,并不是固定的 Vue.options
                 */
                vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
            }
            vm._self = vm;
            initLifecycle(vm);
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
    function resolveConstructorOptions(Ctor) {
        let optioins = Ctor.options;
        return optioins;
    }
    function initInternalComponent(vm, options) {
        const opts = (vm.$options = Object.create(vm.constructor.options));
        // doing this because it's faster than dynamic enumeration.
        const parentVnode = options._parentVnode;
        opts.parent = options.parent;
        opts._parentVnode = parentVnode;
        const vnodeComponentOptions = parentVnode.componentOptions;
        opts.propsData = vnodeComponentOptions.propsData;
        opts._parentListeners = vnodeComponentOptions.listeners;
        opts._renderChildren = vnodeComponentOptions.children;
        opts._componentTag = vnodeComponentOptions.tag;
        if (options.render) {
            opts.render = options.render;
            opts.staticRenderFns = options.staticRenderFns;
        }
    }

    function Vue$1(options) {
        if (!(this instanceof Vue$1)) {
            warn$1("Vue is a constructor and should be called with the `new` keyword");
        }
        this._init(options);
    }
    /**
     * Vue.prototype._init
     */
    //@ts-expect-error
    initMixin(Vue$1);
    /**
     * Vue.prototype.$set,
     * Vue.prototype.$delete,
     * Vue.prototype.$watch
     */
    //@ts-expect-error
    stateMixin(Vue$1);
    /**
     * Vue.prototype._update
     * Vue.prototype.$forceUpdate
     * Vue.prototype.$destroy
     */
    //@ts-expect-error
    lifecycleMixin(Vue$1);
    /**
     * Vue.prototype._render
     * Vue.prototype.$nextTick
     */
    //@ts-expect-error
    renderMixin(Vue$1);

    /** 添加全局 API  */
    initGlobalAPI(Vue$1);

    const namespaceMap = {
        svg: "http://www.w3.org/2000/svg",
        math: "http://www.w3.org/1998/Math/MathML",
        xhtml: "http://www.w3.org/1999/xhtml",
    };
    const isHTMLTag = makeMap("html,body,base,head,link,meta,style,title," +
        "address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section," +
        "div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul," +
        "a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby," +
        "s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video," +
        "embed,object,param,source,canvas,script,noscript,del,ins," +
        "caption,col,colgroup,table,thead,tbody,td,th,tr," +
        "button,datalist,fieldset,form,input,label,legend,meter,optgroup,option," +
        "output,progress,select,textarea," +
        "details,dialog,menu,menuitem,summary," +
        "content,element,shadow,template,blockquote,iframe,tfoot");
    const isSVG = makeMap("svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face," +
        "foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern," +
        "polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view", true);
    /** tag 是否是 pre 标签 */
    const isPreTag = (tag) => tag === "pre";
    /**
     * 如果不是保留标签，则判断为自定义组件名
     */
    const isReservedTag = (tag) => {
        return !!isHTMLTag(tag) || !!isSVG(tag);
    };
    function getTagNamespace(tag) {
        if (isSVG(tag)) {
            return "svg";
        }
        // basic support for MathML
        // note it doesn't support other MathML elements being component roots
        if (tag === "math") {
            return "math";
        }
    }

    /**
     * 布尔属性:只要在模版上出现，就会应用属性的特性，无论是否有属性值或者属性值为任意值
     *
     * 只要 hidden 出现，div就一定会被隐藏
     * <div hidden></div>
     *
     * 并不关心 hidden 的属性值,照样隐藏，为了不隐藏 div,只能删除 hidden 属性
     * <div hidden='false'></div>
     *
     */
    const isBooleanAttr = makeMap("allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare," +
        "default,defaultchecked,defaultmuted,defaultselected,defer,disabled," +
        "enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple," +
        "muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly," +
        "required,reversed,scoped,seamless,selected,sortable," +
        "truespeed,typemustmatch,visible");
    /**
     * undefined == null    true
     * undefined === null   false
     */
    function isFalsyAttrValue(value) {
        return value == null || value === false;
    }
    /** 属性的值为 true/false */
    const isEnumeratedAttr = makeMap("contenteditable,draggable,spellcheck");
    const isValidContentEditableValue = makeMap("events,caret,typing,plaintext-only");
    /**
     * 浏览器 HTML 页面 <div contenteditable></div>，outerHTML '<div contenteditable=""></div>'
     * Vue 会将 contenteditable="" 转成 contenteditable="true"
     *
     */
    function convertEnumeratedValue(key, value) {
        return isFalsyAttrValue(value) || value === "false"
            ? "false"
            : key === "contenteditable" && isValidContentEditableValue(value)
                ? value
                : "true";
    }
    const acceptValue = makeMap("input,textarea,option,select,progress");
    /**
     * 是否使用 DOM 原生的属性绑定
     * div.innerHTML = 'aa'
     * input.value = 'aa'
     */
    const mustUseProp = (tag, type, attr) => {
        return ((attr === "value" && acceptValue(tag) && type !== "button") ||
            (attr === "selected" && tag === "option") ||
            (attr === "checked" && tag === "input") ||
            (attr === "muted" && tag === "video"));
    };
    const xlinkNS = "http://www.w3.org/1999/xlink";
    /**
     * xlink:type="simple"
     * xlink:href="http://book.com/images/HPotter.gif"
     * xlink:show="new"
     */
    const isXlink = (name) => {
        return name.charAt(5) === ":" && name.slice(0, 5) === "xlink";
    };
    /** 'xlink:href' 获取 'href'*/
    const getXlinkProp = (name) => {
        return isXlink(name) ? name.slice(6) : "";
    };

    //
    /**
     * 如果是 string 类型，说明是 css selector,根据 selector 查找到 DOMElement
     * @param el string | Element
     * @returns Element
     */
    function query(el) {
        if (typeof el === "string") {
            const selected = document.querySelector(el);
            if (!selected) {
                warn$1("Cannot find element: " + el);
                /**为了生成渲染函数过程中不报错 */
                return document.createElement("div");
            }
            return selected;
        }
        else {
            return el;
        }
    }

    /**
     * 相同情况:
     * 1. <div></div> => <div></div>
     *    复用 div
     * 2. <div id='app'></div> => <div id='hi'></div>
     *    踏 tag 相同，且都有 data 属性
     * 3. 两个文本节点认为是相同的
     *
     * 不相同的情况:
     * 1. 标签不一致 <div></div> => <p></p>
     *  依据 a.tag === b.tag
     * 2. <div id='app'></div> => <div></div>
     *  依据 isDef(a.data) === isDef(b.data)
     */
    function sameVnode(a, b) {
        return a.key === b.key && a.tag === b.tag && isDef(a.data) === isDef(b.data);
    }
    /**区分 Element 还是 VNode */
    function isRealElement(param) {
        return isDef(Reflect.get(param, "nodeType"));
    }
    const emptyNode = new VNode("", {}, []);
    const hooks = ["create", "activate", "update", "remove", "destroy"];
    /**根据不同平台创建不同 patch  */
    function createPatchFunction(backend) {
        const cbs = {
            create: [],
            activate: [],
            update: [],
            remove: [],
            destroy: [],
        };
        hooks.forEach((hook) => (cbs[hook] = []));
        const { nodeOps, modules } = backend;
        hooks.forEach((hook) => {
            modules.forEach((module) => {
                module[hook] && module[hook] && cbs[hook].push(module[hook]);
            });
        });
        function invokeCreateHooks(vnode) {
            for (let i = 0; i < cbs.create.length; i++) {
                cbs.create[i](emptyNode, vnode);
            }
        }
        function emptyNodeAt(elm) {
            return new VNode(elm.tagName, {}, [], undefined, elm);
        }
        function isPatchable(vnode) {
            return isDef(vnode.tag);
        }
        function patchVnode(oldVnode, vnode) {
            if (oldVnode === vnode) {
                return;
            }
            /**
             * vnode.elm 还未调用 createElm 创建真实 DOM ,也不需要创建，直接复用 oldVnode.elm
             * elm 可能为 Element节点 或者 text节点
             */
            const elm = (vnode.elm = oldVnode.elm);
            const data = vnode.data;
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            /**
             * 如果 data 存在，那么 oldVnode.data 一定存在，
             * 进入 patchVnode 的条件之一是: isDef(a.data) === isDef(b.data)
             * 则更新标签上的 data
             */
            if (isDef(data) && isPatchable(vnode)) {
                for (let i = 0; i < cbs.update.length; i++) {
                    cbs.update[i](oldVnode, vnode);
                }
            }
            if (isUndef(vnode.text)) {
                /** vnode 代表元素节点 */
                if (isDef(oldCh) && isDef(ch)) {
                    /**
                     * 老节点: <div><p>p1</p><p>p2</p></div>
                     * 新节点: <div><p>p2</p>world<span>s1</span></div>
                     * 新节点和老节点都有儿子，需要将儿子按顺序逐个比较
                     */
                    if (oldCh !== ch) {
                        updateChildren(elm, oldCh, ch);
                    }
                }
                else if (isDef(ch)) {
                    /**
                     * 老节点没有儿子: <div></div>
                     * 新节点有儿子: <div>hello</div>
                     * 只需将新节点的儿子插入 vnode.elm 中即可
                     * 新节点还未挂载，所以需要 parentElm 参数
                     */
                    addVnodes(elm, null, ch, 0, ch.length - 1);
                }
                else if (isDef(oldCh)) {
                    /**
                     * 老节点有儿子: <div>hello</div>
                     * 新节点没有儿子: <div></div>
                     * 只需 vnode.elm 清空子节点
                     * 老节点已经挂载过，所以 elm 一定不为空，不需要传入 parentElm 参数
                     */
                    removeVnodes(oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    nodeOps.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                /** vnode 代表文本节点 */
                nodeOps.setTextContent(elm, vnode.text);
            }
        }
        function updateChildren(parentElm, oldCh, newCh, removeOnly) {
            const canMove = !removeOnly;
            let refElm;
            let oldStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let newStartIdx = 0;
            let newEndIdx = newCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            /**
             * 两个链表同时比较，尽可能少的创建节点
             */
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (isUndef(oldStartVnode)) {
                    /** 最后一个分支中  oldCh[idxInOld] = undefined; */
                    oldStartVnode = oldCh[++oldStartIdx];
                }
                else if (isUndef(oldEndVnode)) {
                    /** 最后一个分支中  oldCh[idxInOld] = undefined; */
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    /**
                     * <div v-if="show">hello<p>p1</p></div>
                     * <div v-else>world</div>
                     *
                     * oldStartVnode 和 newStartVnode 都为文本节点,
                     * 则从链表 头部 开始比较
                     */
                    patchVnode(oldStartVnode, newStartVnode);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    /**
                     * <div v-if="show"><p>p1</p>hello</div>
                     * <div v-else>world</div>
                     *
                     * oldStartVnode 和 newStartVnode 不是同类型节点，则比较  oldEndVnode 和 newEndVnode
                     * oldEndVnode 和 newEndVnode 都为文本节点
                     * 则从链表 尾部 开始比较
                     */
                    patchVnode(oldEndVnode, newEndVnode);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    /**
                     * <div v-if="show">hello<p>p1</p></div>
                     * <div v-else><p>p2</p>world</div>
                     *
                     * oldStartVnode 和 newStartVnode 不是同类型节点，则比较  oldEndVnode 和 newEndVnode
                     * oldEndVnode 和 newEndVnode 也不是同类型节点，则比较
                     * oldStartVnode 和 newEndVnode 都为文本节点
                     * oldCh 从链表头开始比较 newCh 从链表尾开始比较
                     * 注意:每次比较完之后，比较方向会重新计算
                     */
                    patchVnode(oldStartVnode, newEndVnode);
                    /**
                     * 这里 referenceNode 是 nodeOps.nextSibling(oldEndVnode.elm!)
                     * 而不是直接插入在 parentElm 尾部,因为
                     *
                     * <div v-if="show">hello<p>p1</p><span>s1</span></div>
                     * <div v-else><p>p2</p>world<span>s2</span></div>
                     *
                     * 会先进入 sameVnode(oldEndVnode, newEndVnode)
                     * 然后再进入当前分支，此时剩余比较节点为:
                     *
                     * <div v-if="show">hello<p>p1</p>[完成比较:<span>s1</span>]</div>
                     * <div v-else><p>p2</p>world[完成比较:<span>s2</span]></div>
                     *
                     * oldStartVnode 指向 hello     oldEndVnode 指向 <p>p1</p>
                     * newStartVnode 指向 <p>p2</p>  newEndVnode 指向 world
                     *
                     * hello 更新为 world 后要插入在 span 前面
                     */
                    canMove &&
                        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    /**
                     * <div v-if="show"><div>p1</div>hello</div>
                     * <div v-else>world<p>p2</p></div>
                     *
                     */
                    patchVnode(oldEndVnode, newStartVnode);
                    canMove &&
                        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    /**
                     * 当前分支以 newCh 为基准,只有进入 sameVnode 后，才会移动 oldCh 指针
                     *
                     * <div v-if="show"><div>div1</div>hello</div>
                     * <div v-else><p>p1</p><span>s1</span></div>
                     * 上面分支都不成立后，进入当前分支
                     * 在 oldCh 中查找有没有 p,没有，则将 p 插在 div 前面,移动 newStartIdx 指针
                     * newStartIdx 指向 span,在 oldCh 中查看有没有 span,没有则将 span 插在 div 前面,移动 newStartIdx 指针
                     * newStartIdx > newEndIdx,跳出 while 循环,删除 oldCh 中 [div,hello]
                     *
                     * <div v-if="show"><span>s1</span>hello<div>d1</div></div>
                     * <div v-else><p>p1</p>world</div>
                     * p 插入到 span 前,移动 newStartIdx 指针,指向 world 文本节点
                     * 在 oldCh 查找是否有文本节点,有,则更新 hello => world,并将 hello 节点处设置为undefined
                     * 将 world 插入到 span 之间 => p world span hello div,
                     * 移动 newStartIdx 指针
                     * newStartIdx > newEndIdx,跳出 while 循环,删除 oldCh 中 [span,hello,div]
                     */
                    let oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    /**
                     * 查找 newStartVnode 在 oldCh 中的 sameVnode
                     * newStartVnode:<p>p1</p> ,走 findIdxInOld(),在 oldCh 中查找相同的 p 节点
                     * newStartVnode:<p key='a'>p1</p>,走 oldKeyToIdx[newStartVnode.key] ,在 olcCh 中通过 oldKeyToIdx 查找相同 key 为'a' 的节点
                     */
                    let idxInOld = isDef(newStartVnode.key)
                        ? oldKeyToIdx[newStartVnode.key]
                        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
                    if (isUndef(idxInOld)) {
                        /** 在 oldCh [oldStartIdx,oldEndIdx) 间没有找到相同节点，则创建新节点*/
                        createElm(newStartVnode, parentElm, oldStartVnode.elm, false);
                    }
                    else {
                        /** 找到复用的节点 */
                        let vnodeToMove = oldCh[idxInOld];
                        if (sameVnode(vnodeToMove, newStartVnode)) {
                            /** 更新 vnodeToMove,且将 vnodeToMove 移动到 oldStartVnode前 */
                            patchVnode(vnodeToMove, newStartVnode);
                            /** 防止数组塌陷，导致循环不准 */
                            oldCh[idxInOld] = undefined;
                            canMove &&
                                nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
                        }
                        else {
                            /**
                             * oldStartVnode:<div key="a"></div>
                             * newStartVnode:<p key='a'>p1</p>
                             * 在 olcCh 中通过 oldKeyToIdx 查找到 key='a' 的节点 div
                             * 但 sameVnode()返回 false,所有新建 p 节点
                             */
                            createElm(newStartVnode, parentElm, oldStartVnode.elm, false);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (oldStartIdx > oldEndIdx) {
                /**
                 * oldCh 先退出 while 循环，说明 oldCh.length <= newCh.length
                 * 则添加 newCh 剩余节点
                 *
                 * <div v-if="show">hello</div>
                 * <div v-else>world<p>p1</p></div>
                 * p 标签插在末尾
                 *
                 * <div v-if="show">hello</div>
                 * <div v-else><p>p1</p>world</div>
                 * p 标签插在开头
                 *
                 */
                // 以oldCh 参考点
                // refElm = isUndef(oldStartVnode) ? null : oldStartVnode.elm!;
                // 以 newCh 参考点
                refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
                /**添加newCh 剩余节点*/
                addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx);
            }
            else if (newStartIdx > newEndIdx) {
                /**
                 * newCh 先退出 while 循环,说明 oldCh.length > newCh.length
                 * 则删除 oldCh 剩余节点
                 *
                 * <div v-if="show">hello<p>p1</p></div>
                 * <div v-else>world</div>
                 * 修改文本 hello => world,此时 oldStartIdx 为下标1, oldEndIdx 为下标1,都指向 p 节点
                 * newStartIdx 为下标1, newEndIdx 为下标0,退出 while 循环,进入当前分支,删除 p
                 *
                 * <div v-if="show">hello<p>p1</p></div>
                 * <div v-else><span>s1</span></div>
                 * 将 span 插入 hello 前面，此时 oldStartIdx 为下标0, oldEndIdx 为下标0,都指向 hello 文本节点
                 * newStartIdx 为下标1, newEndIdx 为下标0,退出 while 循环，进入当前分支,删除 hello 和 p
                 */
                removeVnodes(oldCh, oldStartIdx, oldEndIdx);
            }
        }
        function addVnodes(parentElm, refElm, vnodes, startIdx, endIdx) {
            for (; startIdx <= endIdx; startIdx++) {
                createElm(vnodes[startIdx], parentElm, refElm, false);
            }
        }
        function removeVnodes(vnodes, startIdx, endIdx) {
            for (; startIdx <= endIdx; startIdx++) {
                const vnode = vnodes[startIdx];
                if (isDef(vnode)) {
                    if (isDef(vnode.tag)) {
                        removeAndInvokeRemoveHook(vnode);
                    }
                    else {
                        removeNode(vnode.elm);
                    }
                }
            }
        }
        /** 收集 children 中的 key 节点 */
        function createKeyToOldIdx(children, beginIdx, endIdx) {
            let map = {};
            for (let i = beginIdx; i <= endIdx; i++) {
                const key = children[i]?.key;
                if (key) {
                    map[key] = i;
                }
            }
            return map;
        }
        function findIdxInOld(node, oldCh, start, end) {
            /** 不需要匹配 end 处节点,一定不相同,因为如果相同，直接走 sameVnode(oldEndVnode, newEndVnode)*/
            for (let i = start; i < end; i++) {
                const c = oldCh[i];
                if (isDef(c) && sameVnode(node, c)) {
                    return i;
                }
            }
        }
        function removeAndInvokeRemoveHook(vnode) {
            removeNode(vnode.elm);
        }
        function removeNode(el) {
            const parent = el.parentNode;
            if (isDef(parent)) {
                nodeOps.removeChild(parent, el);
            }
        }
        /**
         * 1. <body><div id='app'></div></body>
         *      appendChild()直接插入尾部
         * 2. <body><div id='app'></div><div id='ref'></div></body>
         *     insertBefore() #ref 之前
         * 因为逻辑是用 elm  替换 oldElm,可不是随便插入的
         * @param parent
         * @param elm
         * @param ref
         */
        function insert(parent, elm, ref) {
            if (isDef(parent)) {
                if (isDef(ref)) {
                    if (nodeOps.parentNode(ref) === parent) {
                        nodeOps.insertBefore(parent, elm, ref);
                    }
                }
                else {
                    nodeOps.appendChild(parent, elm);
                }
            }
        }
        function createChildren(vnode, children) {
            if (isArray(children)) {
                for (let i = 0; i < children.length; i++) {
                    createElm(children[i], vnode.elm, null, true);
                }
            }
        }
        function createComponent(vnode, parentElm, refElm) {
            /**
             * <my-component></my-component>
             * 当前的 vnode 就是 my-component 对应的 vnode，页面上不会渲染 my-component,
             * 所以当前 vnode 称为 组件的占位vnode
             * 调用 init() 创建 my-component 中定义的 vue 子类，创建的 vue 实例赋值给 vnode.componentInstance
             * 那么当前组件占位vnode就获得了内部的 vue 实例,将 vue 实例的 $el 提取给上一层的 placeholderVnode
             * placeholderVnode 和 parentElm 有父子关系,从而实现真实 DOM 的 appendChild
             */
            let i = vnode.data;
            if (isDef(i) && isDef(i.hook)) {
                let init = i.hook.init;
                init(vnode);
                if (vnode.componentInstance) {
                    if (vnode.componentInstance && vnode.componentInstance.$el) {
                        vnode.elm = vnode.componentInstance.$el;
                        insert(parentElm, vnode.elm, refElm);
                    }
                }
                return true;
            }
        }
        /**
         * 创建真实 DOM  vnode.elm = nodeOps.createElement
         * 并挂载到页面上 insert(parentElm, vnode.elm!, refElm);
         */
        function createElm(vnode, parentElm, refElm, nested) {
            vnode.isRootInsert = !nested;
            if (createComponent(vnode, parentElm, refElm))
                return;
            const data = vnode.data;
            const children = vnode.children;
            const tag = vnode.tag;
            if (isDef(tag)) {
                /**创建 Element 节点 */
                vnode.elm = vnode.ns
                    ? nodeOps.createElementNS(vnode.ns, tag)
                    : nodeOps.createElement(tag, vnode);
                /**
                 * 模仿 Angular
                 *  <div>
                 *     <hello><div>Who are you </div></hello>
                 *  </div>
                 * 在页面上渲染组件标签
                 */
                // 删除 if (createComponent(vnode, parentElm, refElm)) return,正常创建 vnode.elm
                // if (vnode.componentOptions) {
                //   // 组件
                //   let vm = new vnode.componentOptions.Ctor();
                //   // vm.$el;
                //   vm.$mount(vnode.elm as Element);
                // } else {
                //   createChildren(vnode, children);
                // }
                /** 所有的 children 挂载到 vnode.elm 上 */
                createChildren(vnode, children);
                if (isDef(data)) {
                    invokeCreateHooks(vnode);
                }
                /** vnode.elm 挂载到 parentElm 上 */
                insert(parentElm, vnode.elm, refElm);
            }
            else if (vnode.isComment) ;
            else {
                /**创建文本节点 */
                vnode.elm = nodeOps.createTextNode(vnode.text);
                insert(parentElm, vnode.elm, refElm);
            }
        }
        /**
         * 用新的 vnode 替换掉老的节点
         * 初次渲染时 oldVnode 为页面上的DOM元素
         * 以后更新 oldVnode 为VNode节点,比对 oldVnode和vnode
         * vm.$mount('')  && 未配置 el 选项时 oldVnode 为undefined,渲染函数为 createEmptyVNode
         * vnode:渲染函数生成的VNode,一定存在
         */
        return function patch(oldVnode, vnode) {
            if (isUndef(vnode)) {
                return;
            }
            if (isUndef(oldVnode)) {
                /**
                 * vm.$mount() 没有传递挂载目标元素, 空挂载时仍然创建 DOM 元素
                 * vm.$el = vnode.elm,只是 vnode.elm 没有父 element，所以不在页面上显示而已
                 * 一般组件挂载走该分支
                 */
                createElm(vnode);
            }
            else {
                if (!isRealElement(oldVnode) && sameVnode(oldVnode, vnode)) {
                    patchVnode(oldVnode, vnode);
                }
                else {
                    if (isRealElement(oldVnode)) {
                        /** Element 类型包装成 VNode 类型，统一管理 */
                        oldVnode = emptyNodeAt(oldVnode);
                    }
                    /**获取需要被替换的 Element 的父 Element ，之后就可以用 DOM API 替换掉该元素  */
                    const oldElm = oldVnode.elm;
                    const parentElm = nodeOps.parentNode(oldElm);
                    /**从根 VNode 创建真实 DOM ，创建完之后，删除原来的 DOM(oldVnode) */
                    createElm(vnode, parentElm, nodeOps.nextSibling(oldElm));
                    if (isDef(parentElm)) {
                        removeVnodes([oldVnode], 0, 0);
                    }
                }
            }
            return vnode.elm;
        };
    }

    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function createElementNS(namespace, tagName) {
        return document.createElementNS(namespaceMap[namespace], tagName);
    }
    function createElement(tagName, vnode) {
        const elm = document.createElement(tagName);
        if (tagName !== "select") {
            return elm;
        }
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }

    var nodeOps = /*#__PURE__*/Object.freeze({
        __proto__: null,
        appendChild: appendChild,
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        insertBefore: insertBefore,
        nextSibling: nextSibling,
        parentNode: parentNode,
        removeChild: removeChild,
        setTextContent: setTextContent
    });

    function updateDirectives(oldVnode, vnode) { }
    var directives$1 = {
        create: updateDirectives,
        update: updateDirectives,
        destroy: function unbindDirectives(vnode) { },
    };

    var ref = {
        create(_, vnode) { },
        update(oldVnode, vnode) { },
        destroy(vnode) { },
    };

    var baseModules = [ref, directives$1];

    function setAttr(el, key, value) {
        if (el.tagName.indexOf('-') > -1) ;
        else if (isBooleanAttr(key)) {
            if (isFalsyAttrValue(value)) {
                el.removeAttribute(key);
            }
            else {
                /**
                 * :disabled="false" 时删除 disabled 属性
                 * disabled并不关心属性值
                 * :disabled="'add'" 时，转换成<div disabled='disabled'></div>
                 */
                value =
                    key === 'allowfullscreen' && el.tagName === 'EMBED' ? 'true' : key;
                el.setAttribute(key, value);
            }
        }
        else if (isEnumeratedAttr(key)) {
            el.setAttribute(key, convertEnumeratedValue(key, value));
        }
        else if (isXlink(key)) {
            if (isFalsyAttrValue(value)) {
                el.removeAttributeNS(xlinkNS, getXlinkProp(key));
            }
            else {
                el.setAttributeNS(xlinkNS, key, value);
            }
        }
        else {
            baseSetAttr(el, key, value);
        }
    }
    /** 普通属性的添加/删除 */
    function baseSetAttr(el, key, value) {
        if (isFalsyAttrValue(value)) {
            /**
             *  <div :role='role'></div>
             * 当 role 为 null 或者 false 时，删除 role 属性
             */
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    }
    function updateAttrs(oldVnode, vnode) {
        const oldData = oldVnode.data || {};
        const data = vnode.data || {};
        if (isUndef(oldData.attrs) && isUndef(data.attrs)) {
            return;
        }
        const el = vnode.elm;
        const oldAttrs = oldData.attrs || {};
        const attrs = data.attrs || {};
        /**
         * oldAttrs: {id:'app',role:'guest',a:1}
         * newAttrs: {id:'app',role:'admin',b:2}
         *
         * id   没有操作
         * role 修改操作
         * a    删除操作
         * b    添加操作
         *
         */
        for (let key in attrs) {
            if (attrs[key] != oldAttrs[key]) {
                setAttr(el, key, attrs[key]);
            }
        }
        for (let key in oldAttrs) {
            if (isUndef(attrs[key])) {
                if (isXlink(key)) {
                    el.removeAttributeNS(xlinkNS, getXlinkProp(key));
                }
                else if (!isEnumeratedAttr(key)) {
                    /**
                     * contenteditable,draggable,spellcheck会自动保留下来,
                     */
                    el.removeAttribute(key);
                }
            }
        }
    }
    var attrs = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function genClassForVnode(vnode) {
        const data = vnode.data || {};
        //   data.class = [{ bar: true, foo: false }, "base", { hello: 1 + 1 }];
        return renderClass(data.staticClass, data.class);
    }
    function renderClass(staticClass, dynamicClass) {
        if (isDef(staticClass) || isDef(dynamicClass)) {
            return concat(staticClass, stringifyClass(dynamicClass));
        }
    }
    function concat(a, b) {
        /**
         * 类名之间用空格分隔 "foo bar base"
         */
        return a ? (b ? a + ' ' + b : a) : b || '';
    }
    function stringifyClass(value) {
        if (isArray(value)) {
            return stringifyArray(value);
        }
        if (isObject(value)) {
            return stringifyObject(value);
        }
        /**
         * v-bind:class="'foo bar'"
         */
        if (typeof value === 'string') {
            return value;
        }
        return '';
    }
    /**
     * v-bind:class="['bar',['base',['hello']]]" => class="bar base hello"
     * v-bind:class="[{ bar: true, foo: false }, "base", { hello: 1 + 1 }]" => class="bar base hello"
     */
    function stringifyArray(value) {
        let res = '';
        for (let i = 0, l = value.length; i < l; i++) {
            let stringified = stringifyClass(value[i]);
            if (isDef(stringified) && stringified !== '') {
                res += stringified + ' ';
            }
        }
        res = res.replace(/\s$/, '');
        return res;
    }
    /**
     * v-bind:class="{foo:true,bar:false}" => class="foo"
     */
    function stringifyObject(value) {
        let res = '';
        Object.keys(value).forEach((key) => {
            if (value[key]) {
                res += key + ' ';
            }
        });
        res = res.replace(/\s$/, '');
        return res;
    }

    /**
     * core/vdom/patch.ts =>createElm() 中调用，运行时调用
     * 动态绑定表达式时，会在 render()执行时获得结果
     */
    function updateClass(oldVnode, vnode) {
        const data = vnode.data || {};
        const oldData = oldVnode.data;
        const el = vnode.elm;
        if (isUndef(data.class) &&
            isUndef(data.staticClass) &&
            (isUndef(oldData) ||
                (isUndef(oldData.class) && isUndef(oldData.staticClass)))) {
            return;
        }
        /**
         * 解析 class,将对象形式转换成浏览器正常的字符串形式
         * class:{bar:true} => class="bar"
         * class:['baz','ii',{geck:999}] => class="baz ii geck"
         *
         */
        let cls = genClassForVnode(vnode);
        /** 更新的不是 class,则跳过 */
        let _prevClass = el.className;
        if (cls != _prevClass && cls) {
            el.setAttribute("class", cls);
        }
    }
    var klass$1 = {
        create: updateClass,
        update: updateClass,
    };

    function updateDOMListeners() { }
    var events = {
        create: updateDOMListeners,
        update: updateDOMListeners,
    };

    function updateDOMProps() { }
    var domProps = {
        create: updateDOMProps,
        update: updateDOMProps,
    };

    /**
     * @example
     * 字符串:"color: red; font-size: 20px" => 对象:{'color':'red','font-size':'20px'}
     */
    const parseStyleText = cached((cssText) => {
        const res = {};
        /**
         * (?![^(]*\))是一个先行否定断言 字符集中是取反操作
         * ';' 后面的字符需要匹配 [^(]*\)  失败才能满足条件
         *
         * cssText不能是:
         *  'color:red;)'
         *  'color:red;a)
         */
        const listDelimiter = /;(?![^(]*\))/g;
        const propertyDelimiter = /:(.+)/;
        cssText.split(listDelimiter).forEach((item) => {
            const tmp = item.split(propertyDelimiter);
            /**
             * style="color" 并未设置颜色值时，应该不返回结果
             */
            if (tmp.length > 1) {
                /**
                 * style='color:red; font-size:20px'
                 * font-size 前面有空格
                 */
                res[tmp[0].trim()] = tmp[1].trim();
            }
        });
        return res;
    });
    function getStyle(vnode, checkChild) {
        const res = {};
        let styleData = normalizeStyleData(vnode.data || {});
        extend(res, styleData);
        return res;
    }
    /** 合并样式为单个对象形式 {color:'red';font-size:'20px'} */
    function normalizeStyleData(data) {
        const style = normalizeStyleBinding(data.style);
        return data.staticStyle ? extend(data.staticStyle, style) : style;
    }
    /**
     * 合并数组项为单个对象
     * v-bind:style="[{ "font-size": "20px" }, { "text-align": "center" }];" 转成
     * {"font-size": "20px","text-align": "center" }
     */
    function normalizeStyleBinding(bindingStyle) {
        if (isArray(bindingStyle)) {
            return toObject(bindingStyle);
        }
        return bindingStyle;
    }

    const cssVarRE = /^--/;
    const importantRE = /\s*!important$/;
    const vendorNames = ['Webkit', 'Moz', 'ms'];
    let emptyStyle;
    /**
     * 检查 css 属性名的有效性
     * name='font-size' 转成 'fontSize' 之后在 CSSStyleDeclaration 查找是否有 'fontSize'
     */
    const normalize = cached(function (prop) {
        emptyStyle = emptyStyle || document.createElement('div').style;
        prop = camelize(prop);
        if (prop != 'filter' && prop in emptyStyle) {
            return prop;
        }
        /**
         * style="tap-highlight-color:transparent"
         * 属性名:tap-highlight-color 是 chrome 独有的
         * 在 chrome浏览器中，emptyStyle 对象有 WebkitTapHighlightColor属性
         * 最终返回 WebkitTapHighlightColor
         * style="tap-highlight:transparent"
         * 当前浏览器没有 tapHighlight 属性，且 浏览器前缀+TapHighlight 仍找不到
         * 则没有返回
         */
        const capName = prop.charAt(0).toUpperCase() + prop.slice(1);
        /**
         * 不用 vendorNames.forEach(),因为 native code 无法跳出循环
         */
        for (let i = 0, l = vendorNames.length; i < l; i++) {
            const name = vendorNames[i] + capName;
            if (name in emptyStyle) {
                return name;
            }
        }
    });
    function setProp(el, name, value) {
        if (cssVarRE.test(name)) {
            el.style.setProperty(name, value);
        }
        else if (importantRE.test(value)) {
            /**
             * v-bind:style="{'fontSize':'20px'}" => style="font-size:20px !important"
             * setProperty API 要求 value 中不能有 !important
             * @link https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty
             */
            el.style.setProperty(hyphenate(name), value.replace(importantRE, ''), 'important');
        }
        else {
            const normalizedName = normalize(name);
            if (normalizedName) {
                /**
                 * 对于非标准属性
                 * setProperty('WebkitTapHighlightColor','transparent') 是无效的
                 */
                if (isArray(value)) {
                    /**
                     * v-bind:style='{display:["-webkit-box", "-ms-flexbox", "flex"]}'
                     * 兼容性代码放在前面，通用代码最后
                     * chrome 识别 -webkit-box => display:-webkit-box
                     * chrome 不识别 -ms-flexbox
                     * chrome 识别 flex => diplay:flex
                     * 最终结果 diplay:flex
                     */
                    value.forEach((item) => {
                        el.style[normalizedName] = item;
                    });
                }
                else {
                    el.style[normalizedName] = value;
                }
            }
        }
    }
    function updateStyle(oldVnode, vnode) {
        const data = vnode.data || (vnode.data = {});
        const oldData = oldVnode.data || {};
        if (isUndef(data.staticStyle) &&
            isUndef(data.style) &&
            isUndef(oldData.staticStyle) &&
            isUndef(oldData.style)) {
            return;
        }
        const el = vnode.elm;
        // data.style = { "tap-highlight-color": "transparent" };
        const oldStaticStyle = oldData.staticStyle;
        const oldStyleBinding = oldData.normalizedStyle || oldData.style || {};
        const oldStyle = oldStaticStyle || oldStyleBinding;
        const style = normalizeStyleBinding(vnode.data.style) || {};
        vnode.data.normalizedStyle = style;
        const newStyle = getStyle(vnode);
        /**
         * style="color:red;" => style="background:red"
         *
         * 新的 style 中没有 color,则删除 color
         */
        for (let name in oldStyle) {
            if (isUndef(newStyle[name])) {
                setProp(el, name, '');
            }
        }
        /**
         * style="color:red;font-size:20px" => style="color:red;background:red"
         * 新的 style 中有color 值，则不错任何操作
         * 新的 style 中有 background,则添加 background
         */
        let cur;
        for (let name in newStyle) {
            cur = newStyle[name];
            if (cur != oldStyle[name]) {
                setProp(el, name, cur == null ? '' : cur);
            }
        }
    }
    var style$1 = {
        create: updateStyle,
        update: updateStyle,
    };

    function _enter() { }
    const options = inBrowser
        ? {
            create: _enter,
        }
        : {};

    var platformModules = [attrs, klass$1, events, domProps, style$1, options];

    const modules$1 = platformModules.concat(baseModules);
    const patch = createPatchFunction({
        nodeOps,
        modules: modules$1,
    });

    var platformDirectives = {};

    var platformComponents = {};

    const Vue = Vue$1;
    /** 配置平台特有的工具方法，覆盖默认配置 */
    Vue.config.isReservedTag = isReservedTag;
    Vue.config.mustUseProp = mustUseProp;
    /**配置平台特有指令和组件 */
    extend(Vue.options.directives, platformDirectives);
    extend(Vue.options.components, platformComponents);
    Vue.prototype.__patch__ = inBrowser ? patch : noop;
    /**如果没有模版编译，则直接调用该函数 */
    Vue.prototype.$mount = function (el) {
        el = el && inBrowser ? query(el) : undefined;
        return mountComponent(this, el);
    };

    function generateCodeFrame(source, start = 0, end = source.length) {
        const res = [];
        return res.join("\n");
    }

    function createCompileToFunctionFn(compile) {
        /*作为缓存，防止每次都重新编译*/
        const cache = Object.create(null);
        /** runtime-with-compiler 中调用的是该函数 */
        return function compileToFunctions(template, options, vm) {
            options = extend({}, options);
            const warn = options.warn || warn$1;
            Reflect.deleteProperty(options, 'warn');
            /** 检查内容安全策略,看看 new Function()能不能使用，因为在渲染函数执行时，需要使用到 new Function */
            {
                try {
                    new Function('return 1');
                }
                catch (e) {
                    if (e.toString().match(/unsafe-eval|CSP/)) {
                        warn('It seems you are using the standalone build of Vue.js in an ' +
                            'environment with Content Security Policy that prohibits unsafe-eval. ' +
                            'The template compiler cannot work in this environment. Consider ' +
                            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
                            'templates into render functions.');
                    }
                }
            }
            const key = options.delimiters
                ? String(options.delimiters) + template
                : template;
            if (cache[key]) {
                return cache[key];
            }
            /**将 template 编译成字符串函数 */
            const compiled = compile(template, options);
            /** 编译期间的一些警告+报错 */
            {
                if (compiled.errors && compiled.errors.length) {
                    if (options.outputSourceRange) {
                        compiled.errors.forEach((e) => {
                            warn(`Error compiling template:\n\n${e.msg}\n\n` +
                                generateCodeFrame(template, e.start, e.end), vm);
                        });
                    }
                    else {
                        warn(`Error compiling template:\n\n${template}\n\n` +
                            compiled.errors.map((e) => `- ${e}`).join('\n') +
                            '\n', vm);
                    }
                }
            }
            /** 在字符串函数体转真正的函数时收集报错信息 */
            const fnGenErrors = [];
            const res = {
                render: createFunction(compiled.render, fnGenErrors),
                staticRenderFns: compiled.staticRenderFns.map((code) => {
                    return createFunction(code, fnGenErrors);
                }),
            };
            {
                /**
                 * 打印 new Function()时的错误
                 */
                if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
                    warn(`Failed to generate render function:\n\n` +
                        fnGenErrors
                            .map(({ err, code }) => `${err.toString()} in\n\n${code}\n`)
                            .join('\n'), vm);
                }
            }
            // return res as ToFunctionResult;
            return (cache[key] = res);
        };
    }
    /**
     * 所有模版引擎的实现都需要借助 new Function() + with()作用域
     * new Function('a','b','return a+b')
     * function (a,b){return a+b}
     */
    function createFunction(code, errors) {
        try {
            return new Function(code);
        }
        catch (err) {
            errors.push({ err, code });
            return noop;
        }
    }

    function createCompilerCreator(baseCompile) {
        return function createCompiler(baseOptions) {
            function compile(template, options) {
                /**
                 * baseOptions 为通用参数 platforms/web/compiler/options.ts
                 * options 为平台独有参数 platforms/web/runtime-with-comipler.ts
                 */
                const finalOptions = Object.create(baseOptions);
                const errors = [];
                const tips = [];
                let warn = (msg, range, tip) => {
                    (tip ? tips : errors).push(msg);
                };
                if (options) {
                    if (options.outputSourceRange) {
                        const leadingSpaceLength = template.match(/^\s*/)[0].length;
                        warn = (msg, range, tip) => {
                            const data = typeof msg === "string" ? { msg } : msg;
                            if (range) {
                                if (range.start != null) {
                                    data.start = range.start + leadingSpaceLength;
                                }
                                if (range.end != null) {
                                    data.end = range.end + leadingSpaceLength;
                                }
                            }
                            (tip ? tips : errors).push(data);
                        };
                    }
                    if (options.modules) {
                        finalOptions.modules = (baseOptions.modules || []).concat(options.modules);
                    }
                    if (options.directives) {
                        finalOptions.directives = extend(Object.create(baseOptions.directives || null), options.directives);
                    }
                    /**
                     * 由于需要排除 modules 和 directives ，所以这里不用 extend()
                     */
                    for (const key in options) {
                        if (key != "modules" && key != "directives") {
                            finalOptions[key] = options[key];
                        }
                    }
                }
                finalOptions.warn = warn;
                const compiled = baseCompile(template.trim(), finalOptions);
                compiled.errors = errors;
                compiled.tips = tips;
                return compiled;
            }
            return {
                compile,
                compileToFunctions: createCompileToFunctionFn(compile),
            };
        };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var he$1 = {exports: {}};

    /*! https://mths.be/he v1.2.0 by @mathias | MIT license */
    he$1.exports;

    (function (module, exports) {
    (function(root) {

    		// Detect free variables `exports`.
    		var freeExports = exports;

    		// Detect free variable `module`.
    		var freeModule = module &&
    			module.exports == freeExports && module;

    		// Detect free variable `global`, from Node.js or Browserified code,
    		// and use it as `root`.
    		var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
    		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
    			root = freeGlobal;
    		}

    		/*--------------------------------------------------------------------------*/

    		// All astral symbols.
    		var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    		// All ASCII symbols (not just printable ASCII) except those listed in the
    		// first column of the overrides table.
    		// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
    		var regexAsciiWhitelist = /[\x01-\x7F]/g;
    		// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
    		// code points listed in the first column of the overrides table on
    		// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
    		var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

    		var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
    		var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

    		var regexEscape = /["&'<>`]/g;
    		var escapeMap = {
    			'"': '&quot;',
    			'&': '&amp;',
    			'\'': '&#x27;',
    			'<': '&lt;',
    			// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
    			// following is not strictly necessary unless it’s part of a tag or an
    			// unquoted attribute value. We’re only escaping it to support those
    			// situations, and for XML support.
    			'>': '&gt;',
    			// In Internet Explorer ≤ 8, the backtick character can be used
    			// to break out of (un)quoted attribute values or HTML comments.
    			// See http://html5sec.org/#102, http://html5sec.org/#108, and
    			// http://html5sec.org/#133.
    			'`': '&#x60;'
    		};

    		var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
    		var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    		var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
    		var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
    		var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
    		var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
    		var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

    		/*--------------------------------------------------------------------------*/

    		var stringFromCharCode = String.fromCharCode;

    		var object = {};
    		var hasOwnProperty = object.hasOwnProperty;
    		var has = function(object, propertyName) {
    			return hasOwnProperty.call(object, propertyName);
    		};

    		var contains = function(array, value) {
    			var index = -1;
    			var length = array.length;
    			while (++index < length) {
    				if (array[index] == value) {
    					return true;
    				}
    			}
    			return false;
    		};

    		var merge = function(options, defaults) {
    			if (!options) {
    				return defaults;
    			}
    			var result = {};
    			var key;
    			for (key in defaults) {
    				// A `hasOwnProperty` check is not needed here, since only recognized
    				// option names are used anyway. Any others are ignored.
    				result[key] = has(options, key) ? options[key] : defaults[key];
    			}
    			return result;
    		};

    		// Modified version of `ucs2encode`; see https://mths.be/punycode.
    		var codePointToSymbol = function(codePoint, strict) {
    			var output = '';
    			if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
    				// See issue #4:
    				// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
    				// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
    				// REPLACEMENT CHARACTER.”
    				if (strict) {
    					parseError('character reference outside the permissible Unicode range');
    				}
    				return '\uFFFD';
    			}
    			if (has(decodeMapNumeric, codePoint)) {
    				if (strict) {
    					parseError('disallowed character reference');
    				}
    				return decodeMapNumeric[codePoint];
    			}
    			if (strict && contains(invalidReferenceCodePoints, codePoint)) {
    				parseError('disallowed character reference');
    			}
    			if (codePoint > 0xFFFF) {
    				codePoint -= 0x10000;
    				output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
    				codePoint = 0xDC00 | codePoint & 0x3FF;
    			}
    			output += stringFromCharCode(codePoint);
    			return output;
    		};

    		var hexEscape = function(codePoint) {
    			return '&#x' + codePoint.toString(16).toUpperCase() + ';';
    		};

    		var decEscape = function(codePoint) {
    			return '&#' + codePoint + ';';
    		};

    		var parseError = function(message) {
    			throw Error('Parse error: ' + message);
    		};

    		/*--------------------------------------------------------------------------*/

    		var encode = function(string, options) {
    			options = merge(options, encode.options);
    			var strict = options.strict;
    			if (strict && regexInvalidRawCodePoint.test(string)) {
    				parseError('forbidden code point');
    			}
    			var encodeEverything = options.encodeEverything;
    			var useNamedReferences = options.useNamedReferences;
    			var allowUnsafeSymbols = options.allowUnsafeSymbols;
    			var escapeCodePoint = options.decimal ? decEscape : hexEscape;

    			var escapeBmpSymbol = function(symbol) {
    				return escapeCodePoint(symbol.charCodeAt(0));
    			};

    			if (encodeEverything) {
    				// Encode ASCII symbols.
    				string = string.replace(regexAsciiWhitelist, function(symbol) {
    					// Use named references if requested & possible.
    					if (useNamedReferences && has(encodeMap, symbol)) {
    						return '&' + encodeMap[symbol] + ';';
    					}
    					return escapeBmpSymbol(symbol);
    				});
    				// Shorten a few escapes that represent two symbols, of which at least one
    				// is within the ASCII range.
    				if (useNamedReferences) {
    					string = string
    						.replace(/&gt;\u20D2/g, '&nvgt;')
    						.replace(/&lt;\u20D2/g, '&nvlt;')
    						.replace(/&#x66;&#x6A;/g, '&fjlig;');
    				}
    				// Encode non-ASCII symbols.
    				if (useNamedReferences) {
    					// Encode non-ASCII symbols that can be replaced with a named reference.
    					string = string.replace(regexEncodeNonAscii, function(string) {
    						// Note: there is no need to check `has(encodeMap, string)` here.
    						return '&' + encodeMap[string] + ';';
    					});
    				}
    				// Note: any remaining non-ASCII symbols are handled outside of the `if`.
    			} else if (useNamedReferences) {
    				// Apply named character references.
    				// Encode `<>"'&` using named character references.
    				if (!allowUnsafeSymbols) {
    					string = string.replace(regexEscape, function(string) {
    						return '&' + encodeMap[string] + ';'; // no need to check `has()` here
    					});
    				}
    				// Shorten escapes that represent two symbols, of which at least one is
    				// `<>"'&`.
    				string = string
    					.replace(/&gt;\u20D2/g, '&nvgt;')
    					.replace(/&lt;\u20D2/g, '&nvlt;');
    				// Encode non-ASCII symbols that can be replaced with a named reference.
    				string = string.replace(regexEncodeNonAscii, function(string) {
    					// Note: there is no need to check `has(encodeMap, string)` here.
    					return '&' + encodeMap[string] + ';';
    				});
    			} else if (!allowUnsafeSymbols) {
    				// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
    				// using named character references.
    				string = string.replace(regexEscape, escapeBmpSymbol);
    			}
    			return string
    				// Encode astral symbols.
    				.replace(regexAstralSymbols, function($0) {
    					// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
    					var high = $0.charCodeAt(0);
    					var low = $0.charCodeAt(1);
    					var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
    					return escapeCodePoint(codePoint);
    				})
    				// Encode any remaining BMP symbols that are not printable ASCII symbols
    				// using a hexadecimal escape.
    				.replace(regexBmpWhitelist, escapeBmpSymbol);
    		};
    		// Expose default options (so they can be overridden globally).
    		encode.options = {
    			'allowUnsafeSymbols': false,
    			'encodeEverything': false,
    			'strict': false,
    			'useNamedReferences': false,
    			'decimal' : false
    		};

    		var decode = function(html, options) {
    			options = merge(options, decode.options);
    			var strict = options.strict;
    			if (strict && regexInvalidEntity.test(html)) {
    				parseError('malformed character reference');
    			}
    			return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
    				var codePoint;
    				var semicolon;
    				var decDigits;
    				var hexDigits;
    				var reference;
    				var next;

    				if ($1) {
    					reference = $1;
    					// Note: there is no need to check `has(decodeMap, reference)`.
    					return decodeMap[reference];
    				}

    				if ($2) {
    					// Decode named character references without trailing `;`, e.g. `&amp`.
    					// This is only a parse error if it gets converted to `&`, or if it is
    					// followed by `=` in an attribute context.
    					reference = $2;
    					next = $3;
    					if (next && options.isAttributeValue) {
    						if (strict && next == '=') {
    							parseError('`&` did not start a character reference');
    						}
    						return $0;
    					} else {
    						if (strict) {
    							parseError(
    								'named character reference was not terminated by a semicolon'
    							);
    						}
    						// Note: there is no need to check `has(decodeMapLegacy, reference)`.
    						return decodeMapLegacy[reference] + (next || '');
    					}
    				}

    				if ($4) {
    					// Decode decimal escapes, e.g. `&#119558;`.
    					decDigits = $4;
    					semicolon = $5;
    					if (strict && !semicolon) {
    						parseError('character reference was not terminated by a semicolon');
    					}
    					codePoint = parseInt(decDigits, 10);
    					return codePointToSymbol(codePoint, strict);
    				}

    				if ($6) {
    					// Decode hexadecimal escapes, e.g. `&#x1D306;`.
    					hexDigits = $6;
    					semicolon = $7;
    					if (strict && !semicolon) {
    						parseError('character reference was not terminated by a semicolon');
    					}
    					codePoint = parseInt(hexDigits, 16);
    					return codePointToSymbol(codePoint, strict);
    				}

    				// If we’re still here, `if ($7)` is implied; it’s an ambiguous
    				// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
    				if (strict) {
    					parseError(
    						'named character reference was not terminated by a semicolon'
    					);
    				}
    				return $0;
    			});
    		};
    		// Expose default options (so they can be overridden globally).
    		decode.options = {
    			'isAttributeValue': false,
    			'strict': false
    		};

    		var escape = function(string) {
    			return string.replace(regexEscape, function($0) {
    				// Note: there is no need to check `has(escapeMap, $0)` here.
    				return escapeMap[$0];
    			});
    		};

    		/*--------------------------------------------------------------------------*/

    		var he = {
    			'version': '1.2.0',
    			'encode': encode,
    			'decode': decode,
    			'escape': escape,
    			'unescape': decode
    		};

    		// Some AMD build optimizers, like r.js, check for specific condition patterns
    		// like the following:
    		if (freeExports && !freeExports.nodeType) {
    			if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
    				freeModule.exports = he;
    			} else { // in Narwhal or RingoJS v0.7.0-
    				for (var key in he) {
    					has(he, key) && (freeExports[key] = he[key]);
    				}
    			}
    		} else { // in Rhino or a web browser
    			root.he = he;
    		}

    	}(commonjsGlobal)); 
    } (he$1, he$1.exports));

    var heExports = he$1.exports;
    var he = /*@__PURE__*/getDefaultExportFromCjs(heExports);

    /** 是否是自闭标签 <hr/> <br/> */
    const isUnaryTag = makeMap("area,base,br,col,embed,frame,hr,img,input,isindex,keygen," +
        "link,meta,param,source,track,wbr");
    /**
     * 有一些双标签可以省略闭合标签，浏览器会自动加上
     * <p>hello =>浏览器渲染成 <p>hello</p>
     */
    const canBeLeftOpenTag = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source");
    const isNonPhrasingTag = makeMap("address,article,aside,base,blockquote,body,caption,col,colgroup,dd," +
        "details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form," +
        "h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta," +
        "optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead," +
        "title,tr,track");

    /**
     * 第一个分组捕获属性名
     * 第二个分组捕获等于号
     * 第三个分组捕获双引号内的值 id="app"
     * 第四个分组捕获单引号内的值 id='app'
     * 第五个分组捕获没有引号的值 id=app
     * 最后一个量词 ? 表示 第二三四五的捕获可选,仅捕获属性名 disabled
     *
     */
    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    /**
     * 字符集中 "-"和 "." 没有特殊意义，可以不用转义，不过转义也是一样的，比如 "a" 和 "\a" 是相等的
     * 这里采用了转义策略 => \- 和 \.
     * 在正则字面量中可以这样写 /[\-\.0-9]/
     * 但是这里是字符串形式，所以需要将 "\-" 中的 "\" 再进行一次转义 => "\\-"
     * ncname:An XML name that does not contain a colon,即不包含':'的 XML 标签
     */
    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
    /**
     * 由于 xml 中标签名是自定义的<bug></bug>,不同文档中相同的标签名会产生冲突，
     * 所以有这样的写法
     *    <pmx:bug></pmx:bug>
     *    <pmx:bug xmlns:link="xxx"></pmx:bug>
     * 捕获的内容为整个标签名 pmx:bug
     */
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    /** 匹配开始标签，并捕获标签名 */
    const startTagOpen = new RegExp(`^<${qnameCapture}`);
    /**
     * 匹配开始标签的结束符 > 和 />
     * 如果是一元标签，它的 / 会被捕获
     *
     */
    const startTagClose = /^\s*(\/?)>/;
    /** </(标签名)+(任意 '>' 外的字符)+('>'字符) */
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
    const doctype = /^<!DOCTYPE [^>]+>/i;
    /** 注释节点 <!-- This is comment --> */
    const comment = /^<!\--/;
    /**
     * 条件注释节点,只有 IE 浏览器识别，其他浏览器认为是普通的 html 注释
     * <!--[if IE]> <![endif]-->
     * <!--[if IE]> <![endif]-->
     */
    const conditionalComment = /^<!\[/;
    /** script,style,textarea 中可以包含任何内容 */
    const isPlainTextElement = makeMap("script,style,textarea", true);
    const reCache = {};
    /**字符实体映射为html字符 */
    const decodingMap = {
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&amp;": "&",
        "&#10;": "\n",
        "&#9;": "\t",
        "&#39;": "'",
    };
    const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
    const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;
    /**
     * <pre>\nhello</pre>
     * 浏览器的行为是将pre标签中第一个 '\n' 删除
     */
    const isIgnoreNewlineTag = makeMap("pre,textarea", true);
    /**模拟浏览器行为 */
    const shouldIgnoreFirstNewline = (tag, html) => {
        return tag && isIgnoreNewlineTag(tag) && html[0] === "\n";
    };
    /**
     * template:"<div id='&lt;hello'></div>"
     * 解析属性中的实体字符 => <div id='<hello'></div>
     */
    const decodeAttr = function (value, shouldDecodeNewlines) {
        const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
        return value.replace(re, (match) => decodingMap[match]);
    };
    function parseHTML(html, options) {
        /**
         * 每当遇到一个非一元标签,都将该标签的开始标签入栈,
         * 当遇到结束标签时，会检查 stack 的最后一个元素，如果两者标签名匹配，说明标签是完整的标签
         * 比如: <article><section><div></section></article>
         * stack: [articel,section,div]
         * 当结束标签为 section 时，查找 stack 的最后一个元素，发现是 div,两者不匹配，说明 div 缺失闭合标签
         */
        const stack = [];
        const expectHTML = options.expectHTML;
        const isUnaryTag = options.isUnaryTag || no;
        const canBeLeftOpenTag = options.canBeLeftOpenTag || no;
        /**当前字符流的读入位置 */
        let index = 0;
        /** 当前还未解析的 html 字符 */
        let last;
        /** 始终存储着 stack 栈顶的元素 */
        let lastTag = void 0;
        while (html) {
            last = html;
            if (!lastTag || !isPlainTextElement(lastTag)) {
                /**
                 * lastTag 为 undefined,表示第一次解析,则进入该分支
                 * lastTag 有值，且不是 script,textarea,style,则进入该分支
                 */
                let textEnd = html.indexOf("<");
                /** 开始标签的开始符或者结束标签的开始符*/
                if (textEnd == 0) {
                    /**
                     * textEnd ==0:
                     *    comment,conditionalComment,doctypeMatch
                     *    开始标签 <div>
                     *    结束标签 </div>
                     *    文本内容 <abcded
                     */
                    if (comment.test(html)) {
                        /**
                         * html注释
                         * <!-- comment -->
                         */
                        const commentEnd = html.indexOf("-->");
                        if (commentEnd >= 0) {
                            if (options.shouldKeepComment && options.comment) {
                                /**
                                 * <!--comment-->
                                 * 获取注释内容，以及注释起止位置
                                 */
                                options.comment(html.slice(4, commentEnd), index, index + commentEnd + 3);
                            }
                            /** 剔除注释 */
                            advance(commentEnd + 3);
                            /** 结束当前循环，开启下一个循环 */
                            continue;
                        }
                    }
                    if (conditionalComment.test(html)) {
                        const conditionalEnd = html.indexOf("]>");
                        if (conditionalEnd >= 0) {
                            advance(conditionalEnd + 2);
                            continue;
                        }
                    }
                    const doctypeMatch = html.match(doctype);
                    if (doctypeMatch) {
                        advance(doctypeMatch[0].length);
                        continue;
                    }
                    /**开始标签<div id="app"> */
                    const startTagMatch = parseStartTag();
                    if (startTagMatch) {
                        handleStartTag(startTagMatch);
                        if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                            advance(1);
                        }
                        /** 开始标签解析完毕，返回循环，开始解析子节点或者结束标签 */
                        continue;
                    }
                    const endTagMatch = html.match(endTag);
                    /**
                     * 闭合标签</div>
                     * ['</div>','div']
                     */
                    if (endTagMatch) {
                        /**index当前为闭合标签在source html 中的开始位置 */
                        const curIndex = index;
                        advance(endTagMatch[0].length);
                        parseEndTag(endTagMatch[1], curIndex, index);
                        /**当前标签解析结束，继续解析子元素或者根标签解析结束，退出解析 */
                        continue;
                    }
                }
                let rest;
                let next;
                let text;
                /**
                 * 解析文本内容
                 * " < 10 "时,textEnd 为 0,但 '<' 并不作为开始符解析,而是作为文本解析
                 */
                if (textEnd >= 0) {
                    /** rest 不一定是结束标签的开始符 */
                    rest = html.slice(textEnd);
                    /**
                     * 遇到的 '<' 不是标签的开始符，而是文本显示内容时，进入循环
                     * <div>hello 1 < 10 </div> textEnd ==8
                     * <div>< 10 </div>  textEnd == 0 ,进入 if(textEnd==0)分支，但不做任何事情
                     * <div>hello </div> 不进入循环
                     */
                    while (!endTag.test(rest) &&
                        !startTagOpen.test(rest) &&
                        !comment.test(rest) &&
                        !conditionalComment.test(rest)) {
                        next = rest.indexOf("<", 1);
                        /**<div>hello 1< 10 忘记写闭合标签时,next == -1 */
                        if (next < 0)
                            break;
                        textEnd += next;
                        rest = html.slice(textEnd);
                    }
                    /**退出循环后，textEnd指向关闭标签的开始符,text为标签的文本内容，rest为关闭标签+剩余内容 */
                    text = html.slice(0, textEnd);
                }
                if (textEnd < 0) {
                    text = html;
                }
                if (text) {
                    /**处理完后，html 为</div>,重新进入循环，textEnd==0,但是解析的是闭合标签 */
                    advance(text.length);
                }
                if (options.chars && text) {
                    options.chars(text, index - text.length, index);
                }
            }
            else {
                let endTagLength = 0;
                const stackedTag = lastTag.toLowerCase();
                /**
                 * ([\\s\\S]*?) 表示正则 /([\s\S]*?)/,意思是非贪婪捕获任意字符,只要第二个分组匹配成功，/([\s\S]*?)/就停止匹配
                 * "[^>]*>" 表示 </textarea>可以写成 </textareaoooo>,因为在 codegen中只用到了开始标签名
                 */
                const reStackedTag = reCache[stackedTag] ||
                    (reCache[stackedTag] = new RegExp("([\\s\\S]*?)(</" + stackedTag + "[^>]*>)", "i"));
                /**
                 * html:"hello</textarea>abc"
                 * matched:"hello</textarea>"
                 * text:"hello"
                 * endTag:"textarea"
                 */
                const rest = html.replace(reStackedTag, function (matched, text, endTag) {
                    endTagLength = endTag.length;
                    /** ??? */
                    if (!isPlainTextElement(stackedTag) && stackedTag != "noscript") {
                        text = text
                            .replace(/<!\--([\s\S]*?)-->/g, "$1") // #7298
                            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1");
                    }
                    if (shouldIgnoreFirstNewline(stackedTag, text)) {
                        /** pre,textarea 将忽略首行的 \n */
                        text = text.slice(1);
                    }
                    if (options.chars) {
                        /** 将纯文本标签里的内容全部当做文本处理 */
                        options.chars(text);
                    }
                    /** rest 保存剔除纯文本标签之后的内容,这里是剩余的 abc */
                    return "";
                });
                /** index 指向 'a' 位置*/
                index += html.length - rest.length;
                html = rest;
                parseEndTag(stackedTag, index - endTagLength, index);
            }
            /**
             * 经过循环体代码后，html 没有任何改变,则将 html 当做纯文本对待
             */
            if (html == last) {
                options.chars && options.chars(html);
                if (!stack.length && options.warn) {
                    options.warn(`Mal-formatted tag at end of template: "${html}"`, {
                        start: index + html.length,
                    });
                }
                break;
            }
        }
        /** 处理 stack 栈中剩余标签 */
        parseEndTag();
        /** 由于要动态删除html字符串，所以定义为闭包 */
        function parseStartTag() {
            const start = html.match(startTagOpen);
            if (start) {
                const match = {
                    tagName: start[1],
                    attrs: [],
                    start: index,
                    end: index,
                };
                /** 删除 <div 部分 */
                advance(start[0].length);
                let end;
                let attr;
                /**
                 * 匹配开始标签的结束符,如果匹配失败，则表明开始标签有属性
                 * 每次只能匹配一个属性，所以需要循环,一直到开始标签的结束符
                 */
                while (!(end = html.match(startTagClose)) &&
                    (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
                    /** attr=[' id="app"','id','=','app'] */
                    attr.start = index;
                    advance(attr[0].length);
                    attr.end = index; // index = oldIndex+attr[0].length
                    match.attrs.push(attr);
                }
                /**
                 * 属性匹配结束，进入开始标签的结束符
                 * 如果 end 匹配失败，说明刚刚匹配的根本就不是一个开始标签
                 */
                if (end) {
                    match.unarySlash = end[1];
                    advance(end[0].length);
                    match.end = index;
                    return match;
                }
            }
        }
        function handleStartTag(match) {
            const tagName = match.tagName;
            const unarySlash = match.unarySlash;
            if (expectHTML) {
                if (lastTag === "p" && isNonPhrasingTag(tagName)) {
                    /**
                     * p 标签的特性是里面的内容必须是段落式内容
                     * <p><h2></h2></p>
                     * 当解析到 h2 时，由于 lastTag=='p' 且 h2 不是段落式内容，则需要关闭上一个'p'
                     * => <p></p><h2></h2></p>
                     * 并且最后一个 </p> 会被解析为 <p></p>
                     * 所以最终变成 => <p></p><h2></h2><p></p>
                     */
                    parseEndTag(lastTag);
                }
                if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
                    /**
                     * 当解析到是一个可省略闭合标签的标签时比如 p,且上一个解析的标签也是 p
                     * <p>one<p>two
                     * 第一个 p 未遇到结束标签，说明还在栈中，
                     * 解析到第二个 p 时，
                     */
                    parseEndTag(tagName);
                }
            }
            /**
             * 判断 tagName 是否是 HTML 一元标签
             * 但是自定义组件 <my-component/> 需要根据 unarySlash 来判断
             */
            const unary = isUnaryTag(tagName) || !!unarySlash;
            const l = match.attrs.length;
            /**
             * 正则匹配的 RegExpMatchArray 需要格式化成对象形式
             * Array:
             * [
             *  {name:'id',value:'app'},
             *  {name:'style',value:'color:red;font-size:20px'}
             * ]
             *
             *
             */
            const attrs = new Array(l);
            for (let i = 0; i < l; i++) {
                const args = match.attrs[i];
                /** id="app" ||  id='app'  || id=app */
                const value = args[3] || args[4] || args[5] || "";
                const shouldDecodeNewlines = tagName == "a" && args[1] == "href"
                    ? options.shouldDecodeNewlinesForHref
                    : options.shouldDecodeNewlines;
                attrs[i] = {
                    name: args[1],
                    value: decodeAttr(value, !!shouldDecodeNewlines),
                };
            }
            /**开始标签入栈 */
            if (!unary) {
                stack.push({
                    tag: tagName,
                    lowerCasedTag: tagName.toLowerCase(),
                    attrs: attrs,
                    start: match.start,
                    end: match.end,
                });
                /** lastTag 始终保持着栈顶元素 */
                lastTag = tagName;
            }
            /**生成AST树节点*/
            if (options.start) {
                options.start(tagName, attrs, unary, match.start, match.end);
            }
        }
        /**
         * 1. 检测是否缺少闭合标签
         * div 缺少关闭标签，在 parseEndTag 中给用户提示
         *    <article><section><div></section></article>
         *
         * 2. 处理 stack栈 中剩余标签
         * 解析完成后, stack 为非空栈
         *    <article><section></section></article><div>
         * 3. 模拟浏览器行为
         * 浏览器行为:</br> 被解析为 <br>
         * 浏览器行为:</p> 被解析为 <p></p>
         * 除了 br 和 p 以外的任何标签，如果只写了闭合标签，都将被忽略
         */
        function parseEndTag(tagName, start, end) {
            let pos;
            let lowerCasedTagName;
            /** 设置为当前字符流的读入位置 */
            if (start == null)
                start = index;
            if (end == null)
                end = index;
            if (tagName) {
                lowerCasedTagName = tagName.toLocaleLowerCase();
                /** 在 stack 中查找关闭标签，并保存查找成功时的位置 */
                for (pos = stack.length - 1; pos >= 0; pos--) {
                    if (lowerCasedTagName == stack[pos].lowerCasedTag) {
                        break;
                    }
                }
            }
            else {
                /**
                 * template:"<div>hello
                 *
                 */
                pos = 0;
            }
            if (pos >= 0) {
                for (let i = stack.length - 1; i >= pos; i--) {
                    if ((i > pos || !tagName) && options.warn) {
                        /**
                         * 和 tagName 匹配的位置应该是 stack 最后一个元素，pos 因该是 stack.length - 1,也就是 pos 和 i 相等
                         * 如果 i 和 pos 不相等，说明 stack中 pos 之后的标签缺少关闭标签
                         *
                         * stack = [1 2 3]
                         * tagName= 1
                         * i=2
                         * pos=0
                         * 说明stack[1]和stack[2]没有闭合
                         *
                         *对应第一条
                         */
                        options.warn(`tag <${stack[i].tag}> has no matching end tag.`, {
                            start: stack[i].start,
                            end: stack[i].end,
                        });
                    }
                    if (options.end) {
                        /**
                         * 闭合标签
                         * <div></div>
                         * <div><p></div>
                         * <div>hello
                         */
                        options.end(stack[i].tag, start, end);
                    }
                }
                /**pos之后的标签出栈 */
                stack.length = pos;
                lastTag = pos ? stack[pos - 1].tag : undefined;
            }
            else if (lowerCasedTagName === "br") {
                /** <div></br></div> */
                if (options.start) {
                    /** tagName 如果是undefined ,则post 为 0 , 不会走该分支 */
                    options.start(tagName, [], true, start, end);
                }
            }
            else if (lowerCasedTagName === "p") {
                /** <div></p></div> */
                if (options.start) {
                    options.start(tagName, [], false, start, end);
                }
                if (options.end) {
                    options.end(tagName, start, end);
                }
            }
        }
        /**
         * 截取 html，html 长度逐渐为 0
         * n表示下一个开始的位置
         */
        function advance(n) {
            html = html.substring(n);
            index += n;
        }
    }

    function parseFilters(exp) {
        let expression;
        let i;
        for (i = 0; i < exp.length; i++) { }
        if (expression === undefined) {
            /**遍历结束 i==exp.length */
            expression = exp.slice(0, i);
        }
        return expression;
    }

    /**
     * 文本内容: {{name}} hello {{age}} world
     * 正则 ".|\r?\n" 需要添加量词，所以用括号包围 => (.|\r?\n)+
     * 由于需要捕获整个单词，而非单个字符，所以子正则使用非捕获 ((?:.|\r?\n)+)
     * 由于仅需要匹配 {{name}}} hello 中的 {{name}},不包含多余的 "}"
     * 所以使用非贪婪模式  ((?:.|\r?\n)+?)
     * 由于需要匹配多次 {{name}} ,{{age}},
     * 所以正则使用 global 匹配 =>  /((?:.|\r?\n)+?)/g
     */
    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
    /**
     * 字符集 : - . * + ? ^ $ { } ( ) | [ ] / \
     * 这些字符在字符集中需要被转义为普通字符，否则有特殊含义
     */
    const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;
    /** delimiters:["&[","&]"] */
    const buildRegex = cached((delimiters) => {
        /** $&表示匹配的子字符串，这里是 "[" 和 "]" */
        let open = delimiters[0].replace(regexEscapeRE, "\\$&"); // "&\\["
        let close = delimiters[1].replace(regexEscapeRE, "\\$&"); // "&\\]"
        return new RegExp(`${open}((?:.|\\n)+?)${close}`, "g");
    });
    function parseText(text, delimiters) {
        const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
        /** 如果是纯文本，则返回，否则就表示有插值表达式 {{expression}} */
        if (!tagRE.test(text)) {
            return;
        }
        /** defaultTagRE 是字面量正则，在global 模式下，
         * 重复进入 parseText 匹配新的 text 时(parseHtml.chars)，需要从位置0开始匹配
         */
        let lastIndex = (tagRE.lastIndex = 0);
        let match;
        const rawTokens = [];
        const tokens = [];
        /** 匹配的开始位置 */
        let index;
        let tokenValue;
        while ((match = tagRE.exec(text))) {
            index = match.index;
            if (index > lastIndex) {
                /**
                 * hello{{msg}}
                 * index:5,
                 * lastIndex:0
                 * 说明匹配的表达式，前面有纯文本
                 */
                rawTokens.push((tokenValue = text.slice(lastIndex, index)));
                /**
                 *  字符串"hello"需要 => "\"hello\""
                 *  因为不这样 "hello" 在被拼接到字符串渲染函数中时
                 *  text="hello"
                 *   `_v(${text})` => "_v(hello)",在函数运行时,
                 *  function (){
                 *    _v(hello)
                 *  }
                 * hello被认为是变量而不是字符串
                 */
                tokens.push(JSON.stringify(tokenValue));
            }
            const exp = parseFilters(match[1].trim());
            tokens.push(`_s(${exp})`);
            rawTokens.push({ "@binding": exp });
            /** index + match[0].length ==  tagRE.lastIndex */
            lastIndex = index + match[0].length;
            // lastIndex = tagRE.lastIndex;
        }
        /**保存最后一个插值表达式后面的文本 */
        if (lastIndex < text.length) {
            rawTokens.push((tokenValue = text.slice(lastIndex)));
            tokens.push(JSON.stringify(tokenValue));
        }
        return {
            /**
             * 渲染函数的函数体:new Function(""hello "+_s(msg)+" age "+_s(age)+" world"")
             */
            expression: tokens.join("+"),
            tokens: rawTokens,
        };
    }

    /**
     * 从模块中提取特定值
     * @example
     * modules = [
     *  {transformNode:..,genData:..},
     *  {transformNode:..,genData:..},
     *  {preTransformNode},
     * ]
     * pluckModuleFunction(modules,'transformNode') => [trans1,trans2,....]
     */
    function pluckModuleFunction(modules, key) {
        /** 先从各个对象中提取 transformNode 属性值，然后剔除 undefined */
        return modules ? modules.map((m) => m[key]).filter((_) => _) : [];
    }
    function baseWarn(msg, rang) {
        console.error(`[Vue compiler]: ${msg}`);
    }
    function getAndRemoveAttr(el, name, removeFromMap) {
        let val = el.attrsMap[name];
        /**
         * null == null
         * undefined == null
         */
        if (val != null) {
            /** 根据 name ，在对象数组中删除某个对象 */
            // const list = el.attrsList;
            // for (let i = 0, l = list.length; i < l; i++) {
            //   if (list[i].name === name) {
            //     list.splice(i, 1);
            //     break;
            //   }
            // }
            let index = el.attrsList.findIndex((attr) => attr.name === name);
            el.attrsList.splice(index, 1);
        }
        if (removeFromMap) {
            Reflect.deleteProperty(el.attrsMap, name);
        }
        return val;
    }
    function getRawBindingAttr(el, name) {
        return (el.rawAttrsMap[":" + name] ||
            el.rawAttrsMap["v-bind:" + name] ||
            el.rawAttrsMap[name]);
    }
    /**
     * name: key ,ref,slot,is,class,style
     * 其中 name为key时,getStatic 为true,如果动态绑定找不到，则寻找静态属性
     */
    function getBindingAttr(el, name, getStatic) {
        const dynamicValue = getAndRemoveAttr(el, ":" + name) || getAndRemoveAttr(el, "v-bind:" + name);
        if (dynamicValue != null) {
            return parseFilters(dynamicValue);
        }
        else if (getStatic !== false) {
            const staticValue = getAndRemoveAttr(el, name);
            if (staticValue != null) {
                return JSON.stringify(staticValue);
            }
        }
    }
    function addAttr(el, name, value, range, dynamic) {
        /**
         * el.dynamicAttrs = [
         *  {
         *    name:"attributename"
         *    value:"apple",
         *    dynamic:true
         *  }
         * ]
         */
        const attrs = dynamic
            ? (el.dynamicAttrs = el.dynamicAttrs || [])
            : (el.attrs = el.attrs || []);
        attrs.push(rangeSetItem({ name, value, dynamic }, range));
        el.plain = false;
    }
    function rangeSetItem(item, range) {
        if (range) {
            if (range.start) {
                item.start = range.start;
            }
            if (range.end) {
                item.end = range.end;
            }
        }
        return item;
    }

    const lineBreakRE = /[\r\n]/;
    const whitespaceRE = /[ \f\t\r\n]+/g;
    const invalidAttributeRE = /[\s"'<>\/=]/;
    /** 通用指令解析 */
    const dirRE = /^v-|^@|^:|^#/;
    /** v-bind 指令解析 */
    const bindRE = /^:|^\.|^v-bind:/;
    const dynamicArgRE = /^\[.*\]$/;
    /**在文本节点中，解码 Html 字符实体  '&lt;' => '<' */
    const decodeHTMLCached = cached(he.decode);
    let transforms = [];
    let warn;
    let delimiters;
    function isTextTag(el) {
        return el.tag === 'script' || el.tag === 'style';
    }
    function createASTElement(tag, attrs, parent) {
        /**
         * attrsList:[{name:'id',value:'"app"',start:,end:,dynamic:}]
         * attrsMap:{'id':"app"}
         * rawAttrsMap:{'id':{name:'id',value:'"app"',start:,end:,dynamic:}}
         */
        let element = {
            type: Node['ELEMENT_NODE'],
            tag: tag,
            attrsList: attrs,
            attrsMap: makeAttrsMap(attrs),
            rawAttrsMap: {},
            parent,
            children: [],
        };
        return element;
    }
    /**
     * Array:
     * [
     *  {name:'id',value:'app'},
     *  {name:'style',value:'color:red;font-size:20px'}
     * ] 转成
     *
     * Object:
     * {
     *    id:'app',
     *    style:'color:red;font-size:20px'
     * }
     * 方便根据属性名查找属性值
     */
    function makeAttrsMap(attrs) {
        let map = {};
        attrs.forEach((attr) => {
            if (map[attr.name]) {
                /**
                 * Vue行为:
                 * <div class="foo" class="bar"></div>
                 * class="bar" 覆盖 class="foo"
                 *
                 * <div v-bind:class="'foo'" v-bind:class="'bar'"
                 * v-bind:class="'bar'" 覆盖  v-bind:class="'foo'"
                 *
                 * 浏览器行为:
                 * <div class="foo" class="bar"></div>
                 * 已经有 class="foo" 则抛弃class="bar"
                 *
                 */
                warn('duplicate attribute: ' + attr.name, attr);
            }
            map[attr.name] = attr.value;
        });
        return map;
    }
    function processElement(el, options) {
        processKey(el);
        /**
         * 处理完结构化指令后，结构化指令不再出现在 el.attrsList 中，
         * key 属性在 processKey(el) 之后，从 el.attrsList 中删除,但是仍需出现在 data 中 data={key:"key"}
         * 如果 el.plain 结果为 true,则表明 el 没有属性，则跳过 genData() 的调用
         */
        el.plain = !el.key && !el.attrsList.length;
        /**
         * style 和 class 单独处理,并从 element.attrsList 中删除
         * v-bind:style 和 v-bind:class 也会剔除，新增 styleBinding 和 classBinding
         * 如果不剔除，也能执行正确，因为 v-bind 被当做普通属性在 processAttrs 中处理
         */
        for (let i = 0; i < transforms.length; i++) {
            el = transforms[i](el, options) || el;
        }
        /**
         * 标签上的(剔除 style 和 class )的剩余属性
         * <div id='app' v-bind:role='role' :count="10" v-on:click="clickHandler" @click="clickHandler" ></div>
         */
        processAttrs(el);
        return el;
    }
    function processKey(el) {
        const exp = getBindingAttr(el, 'key');
        if (exp) {
            {
                if (el.tag === 'template') {
                    warn(`<template> cannot be keyed. Place the key on real elements instead.`, getRawBindingAttr(el, 'key'));
                }
                if (el.for) ;
            }
            el.key = exp;
        }
    }
    function processAttrs(el) {
        const list = el.attrsList;
        for (let i = 0, l = list.length; i < l; i++) {
            let name = list[i].name;
            // let rawName = name;
            let value = list[i].value;
            let isDynamic = false;
            /** attrsList 中除了 DOM 属性，还有 Vue 指令 */
            if (dirRE.test(name)) {
                /** Vue 属性 */
                el.hasBindings = true;
                if (bindRE.test(name)) {
                    /** v-bind 解析 */
                    /** v-bind:title => title */
                    name = name.replace(bindRE, '');
                    /** 处理 value 中的过滤器 v-bind:title="apple | filter" */
                    value = parseFilters(value);
                    isDynamic = dynamicArgRE.test(name);
                    if (isDynamic) {
                        /**
                         * 动态属性名
                         * v-bind:[attributename]="apple"
                         * name 为 attributename 变量值
                         */
                        name = name.slice(1, -1);
                    }
                    /**
                     * v-bind 需要有值
                     * <div v-bind:role></div>
                     */
                    if (value.trim().length === 0) {
                        warn(`The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`);
                    }
                    addAttr(el, name, value, list[i], isDynamic);
                }
            }
            else {
                /** DOM 属性 */
                {
                    const res = parseText(value, delimiters);
                    if (res) {
                        warn(`${name}="${value}": ` +
                            'Interpolation inside attributes has been removed. ' +
                            'Use v-bind or the colon shorthand instead. For example, ' +
                            'instead of <div id="{{ val }}">, use <div :id="val">.', list[i]);
                    }
                }
                addAttr(el, name, JSON.stringify(value), list[i]);
            }
        }
    }
    /**
     *  删除 v-if,v-else,v-else-if,因为真实 DOM 没有这些东西
     */
    function processIf(el) {
        const exp = getAndRemoveAttr(el, 'v-if');
        if (exp) {
            el.if = exp;
            addIfCondition(el, {
                exp,
                block: el,
            });
        }
        else {
            if (getAndRemoveAttr(el, 'v-else') !== null) {
                el.else = true;
            }
        }
    }
    function addIfCondition(el, condition) {
        if (!el.ifConditions) {
            el.ifConditions = [];
        }
        el.ifConditions.push(condition);
    }
    /**
     * 将模版字符串解析成 AST 语法树来描述原生语法，如果使用runtime版本，则不需要 AST 语法树了
     * <div id="app">hello<strong>world</strong></div>
     *
     *  let root = {
     *    tag:"div",
     *    type:ELEMENT_NODE
     *    attrs:[{name:"id",value:"app"}]
     *    parent:null,
     *    children:[
     *        {
     *            tag:undefined,
     *            type:TEXT_NODE,
     *            attrs:[]
     *            text:'hello',
     *            parent:root
     *         },
     *        {
     *            tag:"strong",
     *            type:ELEMENT_NODE,
     *            attrs:[],
     *            parent:root,
     *            children:[
     *                {
     *                    tag:undefined,
     *                    type:TEXT_NODE,
     *                    attrs:[],
     *                    text:"world",
     *                    parent:...
     *                 }
     *            ]
     *        }
     *    ]
     *  }
     */
    function parse(template, options) {
        warn = options.warn || baseWarn;
        delimiters = options.delimiters;
        /**
         * platform/web/compiler/modules
         * 获取 transformNode 函数，结果已经剔除了 undefined，所以 transforms 类型用 Required<T> 处理
         *
         */
        transforms = pluckModuleFunction(options.modules, 'transformNode');
        /**每次解析模版时，都需要生成新的树 */
        let root = void 0;
        let currentParent = void 0;
        /**用于检测标签是否规范 */
        const stack = [];
        const whitespaceOption = options.whitespace;
        const preserveWhitespace = options.preserveWhitespace !== false;
        // let inPre = false;
        let warned = false;
        function warnOnce(msg) {
            if (!warned) {
                warn(msg);
                warned = true;
            }
        }
        /**
         * <div id="app" class='hello'> \n \t hello \t </div>
         * 当前元素正式解析完毕，关闭元素，并且对 element 做一些细致化处理
         */
        function closeElement(element) {
            trimEndingWhitespace(element);
            if (!element.processed) {
                element = processElement(element, options);
            }
            /**
             * <div></div> 关闭 div 时, stack 为空，但是 element 和 root 相等，不会进入 if
             * <div></div><p></p> 关闭 p 时,stack 为空，element 和 root 不相等，进入 if
             * 然后判断 div 和 p 是否是条件渲染，如果是，则说明最终只有一个根节点，
             * 如果不是则会渲染 div 和 p，此时报错，因为 Vue 只能渲染一个根节点
             *
             */
            if (!stack.length && element != root) {
                if (root && root.if && (element.else || element.elseif)) {
                    addIfCondition(root, {
                        exp: element.elseif,
                        block: element,
                    });
                }
                else {
                    warnOnce(`Component template should contain exactly one root element. ` +
                        `If you are using v-if on multiple elements, ` +
                        `use v-else-if to chain them instead.`);
                }
            }
            if (currentParent) {
                element.parent = currentParent;
                currentParent.children.push(element);
            }
        }
        /**
         * 剔除每个 Element 最后节点不能为空的 text 节点
         * <div><p>hello</p> #text1 #text2 #text3</div>
         * 浏览器会从结尾开始，剔除空白字符
         */
        function trimEndingWhitespace(element) {
            let lastNode;
            while ((lastNode = element.children[element.children.length - 1]) &&
                lastNode.type == Node['TEXT_NODE'] &&
                lastNode.text == ' ') {
                element.children.pop();
            }
        }
        /** parseHTML 对模版进行词法分析,钩子函数 start,end,chars,comment进行句法分析 */
        parseHTML(template, {
            warn,
            expectHTML: options.expectHTML,
            isUnaryTag: options.isUnaryTag,
            canBeLeftOpenTag: options.canBeLeftOpenTag,
            shouldDecodeNewlines: options.shouldDecodeNewlines,
            shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
            shouldKeepComment: options.comments,
            outputSourceRange: options.outputSourceRange,
            start(tag, attrs, unary, start, end) {
                let element = createASTElement(tag, attrs, currentParent);
                {
                    if (options.outputSourceRange) {
                        element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
                            cumulated[attr.name] = attr;
                            return cumulated;
                        }, {});
                    }
                    attrs.forEach((attr) => {
                        if (invalidAttributeRE.test(attr.name)) ;
                    });
                }
                if (!element.processed) {
                    processIf(element);
                }
                if (!root) {
                    root = element;
                }
                /**
                 * 如果是自闭标签，则直接关闭
                 * 否则当前标签入栈，作为子标签的父标签标识
                 */
                if (!unary) {
                    currentParent = element;
                    stack.push(element);
                }
                else {
                    closeElement(element);
                }
            },
            end(tag, start, end) {
                /**获取栈顶元素 */
                let element = stack.pop();
                /**获取 element 的 parent */
                currentParent = stack.at(stack.length - 1);
                if (element) {
                    closeElement(element);
                }
            },
            chars(text, start, end) {
                // console.log(text);
                if (!currentParent) {
                    {
                        if (text == template) {
                            warnOnce('Component template requires a root element, rather than just text.');
                        }
                        else if ((text = text.trim())) {
                            warnOnce(`text "${text}" outside root element will be ignored.`);
                        }
                    }
                }
                else {
                    const children = currentParent.children;
                    if (text.trim()) {
                        /**
                         * text 不是空白字符情况下:
                         *
                         * 在script和style标签中的字符实体，浏览器默认不解析
                         * template:"<script>&lt;hello</script>"
                         *
                         * 其他标签中的字符实体,浏览器会解析成 ASCII 字符
                         * template:"<div>&lt;hello</div>"=> <div><hello</div>
                         */
                        text = isTextTag(currentParent)
                            ? text
                            : decodeHTMLCached(text);
                    }
                    else if (!children.length) {
                        /** text 是空白字符，且 text 是原始 html中 currentParent 唯一子节点,不需要显示内容 */
                        text = '';
                    }
                    else if (whitespaceOption) {
                        if (whitespaceOption == 'condense') {
                            /**如果有换行，则返回 "",如果没有，则返回 " " */
                            text = lineBreakRE.test(text) ? '' : ' ';
                        }
                        else {
                            text = ' ';
                        }
                    }
                    else {
                        /**
                         * text 是空白字符 "   \t \n     "
                         * 是否至少保留一个空格
                         *
                         */
                        text = preserveWhitespace ? ' ' : '';
                    }
                    if (text) {
                        if (whitespaceOption == 'condense') {
                            /**
                             * <div>hello \t \r\n \f world </div>
                             * 压缩为
                             * <div>hello world</div>
                             *
                             * 虽然浏览器在渲染时，结果是一样的
                             */
                            text = text.replace(whitespaceRE, '');
                        }
                        let child = void 0;
                        let res;
                        if (text != ' ' && (res = parseText(text, delimiters))) {
                            child = {
                                type: Node.ATTRIBUTE_NODE,
                                expression: res.expression,
                                tokens: res.tokens,
                                text,
                            };
                        }
                        else {
                            /** text 是纯文本 */
                            child = {
                                type: Node['TEXT_NODE'],
                                text,
                            };
                        }
                        if (child) {
                            children.push(child);
                        }
                    }
                }
            },
            comment(text, start, end) { },
        });
        return root;
    }

    function genElement(el, state) {
        if (el.if && !el.ifProcessed) {
            return genIf(el, state);
        }
        else if (el.tag == 'template') {
            return genChildren(el, state) || 'void 0';
        }
        else {
            let data;
            /** el.plain 为 true 表示元素上没有添加任何属性，不需要 genData
             *  <div>hello</div> 纯净的元素
             */
            if (!el.plain) {
                data = genData$2(el, state);
            }
            let tag;
            if (!tag) {
                tag = `'${el.tag}'`;
            }
            const children = genChildren(el, state);
            const code = `_c(${tag}${data ? `,${data}` : ''}${children ? `,${children}` : ''})`;
            return code;
        }
    }
    /**创建子元素 */
    function genChildren(el, state) {
        let children = el.children;
        if (children.length) {
            // const le = children[0];
            if (children.length == 1) ;
            const gen = genNode;
            return `[${children.map((c) => gen(c, state)).join(',')}]${''}`;
        }
    }
    /**创建数据 */
    function genData$2(el, state) {
        let data = '{';
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
        data = data.replace(/,$/, '') + '}';
        if (el.dynamicAttrs) {
            data = `_b(${data},"${el.tag}",${genProps(el.dynamicAttrs)})`;
        }
        return data;
    }
    /**
     * el.attrs = [
     *    {name:'id',value:'"app"',start:,end:,dynamic:}
     *  ]
     */
    function genProps(props) {
        let staticProps = ``;
        let dynamicProps = ``;
        for (let i = 0, l = props.length; i < l; i++) {
            const prop = props[i];
            const value = transformSpecialNewlines(prop.value);
            if (prop.dynamic) {
                dynamicProps += `${prop.name},${value},`;
            }
            else {
                staticProps += `"${prop.name}":${value},`;
            }
        }
        staticProps = `{${staticProps.replace(/,$/, '')}}`;
        if (dynamicProps) {
            return `_d(${staticProps},[${dynamicProps.slice(0, -1)}])`;
        }
        else {
            return staticProps;
        }
    }
    /**
     * JavaScript 规定有5个字符，不能在字符串里面直接使用，只能使用转义形式
     * U+005C：反斜杠（reverse solidus)
     * U+000D：回车（carriage return）
     * U+2028：行分隔符（line separator）
     * U+2029：段分隔符（paragraph separator）
     * U+000A：换行符（line feed）
     *
     * @example 以换行符为例
     * let str = "a\nb"
     * let str = "a\u000ab"
     *
     * JSON 格式的字符
     * let data = '"a\nb"' 在 JSON.parse(data) 时会报错
     * 同样 new Function(`console.log(${data})`) 也会报错
     *
     * 需要将换行符转义
     * let data = '"a\\nb"'
     *
     */
    function transformSpecialNewlines(text) {
        return text.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    }
    function genNode(node, state) {
        if (node.type == Node.ELEMENT_NODE) {
            return genElement(node, state);
        }
        else if (node.type == Node.TEXT_NODE && node.isComment) {
            return '';
        }
        else {
            return genText(node);
        }
    }
    function genIf(el, state) {
        el.ifProcessed = true;
        return genIfConditions(el.ifConditions.slice(), state);
    }
    function genIfConditions(conditions, state) {
        if (!conditions.length) {
            return '_e()';
        }
        const condition = conditions.shift();
        if (condition.exp) {
            return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions, state)}`;
        }
        else {
            return `${genTernaryExp(condition.block)}`;
        }
        function genTernaryExp(el) {
            return genElement(el, state);
        }
    }
    /**
     * template:"hello" 为纯文本时，ast 为 undefined
     * @param ast
     * @param options
     */
    function generate(ast, options) {
        const state = new CodegenState(options);
        const code = ast
            ? ast.tag === 'script'
                ? 'null'
                : genElement(ast, state)
            : '_c("div")'; // 纯文本的情况
        return {
            /**执行时，this指向 vue 实例，通过 with 创建局部作用域 */
            render: `with(this){return ${code}}`,
            staticRenderFns: state.staticRenderFns,
        };
    }
    function genText(text) {
        return `_v(${text.type == Node.ATTRIBUTE_NODE
        ? text.expression
        : JSON.stringify(text.text)})`;
    }
    class CodegenState {
        options;
        staticRenderFns;
        dataGenFns;
        constructor(options) {
            this.options = options;
            this.staticRenderFns = [];
            this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
        }
    }

    /** 一层层封装各平台 CompilerOptions,最终调用 baseCompile  */
    const createCompiler = createCompilerCreator(function baseCompile(template, options) {
        let ast = parse(template.trim(), options);
        let code = generate(ast, options);
        // console.log(code);
        return {
            ast,
            render: code.render,
            staticRenderFns: code.staticRenderFns,
        };
    });

    /** compiler/parser/index.ts => processElement() 中调用,解析模版中的类绑定值,结果为字符串 */
    function transformNode$1(el, options) {
        const warn = options.warn || baseWarn;
        let staticClass = getAndRemoveAttr(el, "class");
        if (staticClass) {
            {
                let res = parseText(staticClass, options.delimiters);
                /**
                 * <div class="{{foo}}"></div>
                 * 老式的属性绑定不再支持，使用 v-bind:class='foo'
                 */
                if (res) {
                    warn(`class="${staticClass}": ` +
                        "Interpolation inside attributes has been removed. " +
                        "Use v-bind or the colon shorthand instead. For example, " +
                        'instead of <div class="{{ val }}">, use <div :class="val">.', el.rawAttrsMap["class"]);
                }
            }
            el.staticClass = JSON.stringify(staticClass.replace(/\s+/g, " ").trim());
        }
        /**
         * 字符串绑定 v-bind:class='foo'
         * 变量绑定   v-bind:class=foo
         * 对象绑定   v-bind:class={foo:true}
         * 数组绑定   v-bind:class=['foo',foo,{foo:true}]
         */
        const classBinding = getBindingAttr(el, "class", false);
        if (classBinding) {
            el.classBinding = classBinding;
        }
    }
    /** compiler/codegen/index.ts => genData() 中调用,生成节点数据 */
    function genData$1(el) {
        let data = "";
        if (el.staticClass) {
            /** data='staticClass:"foo"' */
            data += `staticClass:${el.staticClass},`;
        }
        if (el.classBinding) {
            data += `class:${el.classBinding},`;
        }
        return data;
    }
    var klass = {
        staticKeys: ["staticClass"],
        transformNode: transformNode$1,
        genData: genData$1,
    };

    /** compiler/parser/index.ts => processElement() 中调用,解析模版中的样式绑定,结果为字符串 */
    function transformNode(el, options) {
        const warn = options.warn || baseWarn;
        const staticStyle = getAndRemoveAttr(el, "style");
        if (staticStyle) {
            {
                const res = parseText(staticStyle, options.delimiters);
                if (res) {
                    warn(`style="${staticStyle}": ` +
                        "Interpolation inside attributes has been removed. " +
                        "Use v-bind or the colon shorthand instead. For example, " +
                        'instead of <div style="{{ val }}">, use <div :style="val">.', el.rawAttrsMap["style"]);
                }
            }
            el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
        }
        /**
         * v-bind:style="{color:'red'}"
         * v-bind:style="{fontSize:size}"
         * v-bind:style="[{color:'red'},{fontSize:size}]"
         */
        const styleBinding = getBindingAttr(el, "style", false);
        if (styleBinding) {
            el.styleBinding = styleBinding;
        }
    }
    /** compiler/codegen/index.ts => genData() 中调用,生成节点数据 */
    function genData(el) {
        let data = "";
        if (el.staticStyle) {
            data += `staticStyle:${el.staticStyle},`;
        }
        if (el.styleBinding) {
            data += `style:${el.styleBinding},`;
        }
        return data;
    }
    var style = {
        staticKeys: ["staticStyle"],
        transformNode,
        genData,
    };

    // function transformNode(el: ASTElement) {}
    // function genData(el: ASTElement) {
    //   return "s";
    // }
    var model$1 = {};

    var modules = [klass, style, model$1];

    function html() { }

    function text() { }

    function model() { }

    var directives = {
        html,
        text,
        model,
    };

    /**
     *
     */
    const baseOptions = {
        expectHTML: true,
        modules,
        directives,
        isPreTag,
        isUnaryTag,
        mustUseProp,
        canBeLeftOpenTag,
        isReservedTag,
        getTagNamespace,
        staticKeys: genStaticKeys(modules),
    };

    /**
     * 不同平台传入不同的 options
     */
    const { compile, compileToFunctions } = createCompiler(baseOptions);

    let div = document.createElement("div");
    /** 如果 '\n' 被渲染成 '&#10;',则 Vue 在解析模版时，需要将 '&#10;' 转回 '\n' */
    function getShouldDecode(href) {
        div.innerHTML = href ? `<a href="\n"/>` : `<div a="\n"/>`;
        return div.innerHTML.indexOf("&#10;") > 0;
    }
    /**
     * IE中:<div a="\n"></div>会被渲染成 <div a="&#10;"></div>
     */
    // #3663: IE encodes newlines inside attribute values while other browsers don't
    const shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
    /**
     * Chrome中:<a href="\n"/>会被渲染成 <a href="&#10;"/>
     */
    // #6828: chrome encodes content in a[href]
    const shouldDecodeNewlinesForHref = inBrowser
        ? getShouldDecode(true)
        : false;

    // 将 Vue 的核心进行平台化包装
    /*根据id获取templete，即获取id对应的DOM，然后访问其innerHTML*/
    const idToTemplate = cached((id) => {
        const el = query(id);
        return el && el.innerHTML;
    });
    const mount = Vue.prototype.$mount;
    /*挂载组件，带模板编译*/
    Vue.prototype.$mount = function (el) {
        el = el && query(el);
        /** el 将来会被模版内容替换掉,dody 和 html 是坚决不能替换的 */
        if (el === document.body || el === document.documentElement) {
            warn$1("Do not mount Vue to <html> or <body> - mount to normal elements instead.");
            return this;
        }
        const options = this.$options;
        /**
         * 处理模板template，编译成 render 函数，
         * render 不存在的时候才会编译template，否则优先使用render
         */
        if (!options.render) {
            let template = options.template;
            if (template) {
                if (typeof template === "string") {
                    if (template.charAt(0) == "#") {
                        /** template 为外部模版 id  */
                        template = idToTemplate(template);
                        /**
                         * 无效的模版id
                         * 在挂载时还会报一次错
                         */
                        if (!template) {
                            warn$1(`Template element not found or is empty: ${options.template}`, this);
                        }
                    }
                }
                else if (template instanceof Element) {
                    /** 当 template 为 DOM 节点的时候 */
                    template = template.innerHTML;
                }
                else {
                    {
                        warn$1("invalid template option:" + template, this);
                    }
                    return this;
                }
            }
            else if (el) {
                /**
                 * 没有配置 template 选项，则从 el 表示的 DOM 元素中获取
                 * el查找 DOM 失败，则返回 <div></div>,但是在生成真实 DOM 时，临时 DIV 没有 parentNode ，挂载失败
                 */
                template = getOuterHTML(el);
            }
            if (template) {
                /**将模版字编译成渲染函数 */
                const { render } = compileToFunctions(template, {
                    shouldDecodeNewlines,
                    shouldDecodeNewlinesForHref,
                    delimiters: options.delimiters,
                    outputSourceRange: __DEV__,
                    comments: options.comments,
                }, this);
                options.render = render;
            }
        }
        /**模版编译结束，开始调用 render 挂载组件 */
        return mount.call(this, el);
    };
    /** 获取element 的 outerHTML */
    function getOuterHTML(el) {
        if (el.outerHTML) {
            return el.outerHTML;
        }
        else {
            /** 对于 svg元素, IE9-IE11 无法获取 svg 的  outerHTML */
            const container = document.createElement("div");
            container.appendChild(el.cloneNode(true));
            return container.innerHTML;
        }
    }
    Vue.compile = compileToFunctions;

    return Vue;

}));
//# sourceMappingURL=vue.js.map
