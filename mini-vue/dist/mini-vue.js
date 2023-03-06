/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/reactive/computed.js":
/*!**********************************!*\
  !*** ./src/reactive/computed.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computed": () => (/* binding */ computed)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactive/effect.js");


function computed(getterOrOption) {
    let getter, setter;
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isFunction)(getterOrOption)) { // 判断是否为函数
        getter = getterOrOption
        setter = () => {
            console.warn('computed is readonly');
        }
    } else { // 把计算属性的get set方法 都给getter setter
        getter = getterOrOption.get
        setter = getterOrOption.set
    }
    return new ComputedImpl(getter, setter)
}
class ComputedImpl {
    constructor(getter, setter) { // 继承this
        this._setter = setter
        this._value = undefined
        this._dirty = true
        this.effect = (0,_effect__WEBPACK_IMPORTED_MODULE_1__.effect)(getter, {
            lazy: true,     
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true
                    ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value')
                }
            }
        })
    }
    get value() { // 收集依赖的时候执行一下 把dirty变成false 进不去 scheduler
        if (this._dirty) {
            this._value = this.effect()
            this._dirty = false
            ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value')
        }
        return this._value
    }
    set value(newValue) {
        console.log(this._setter);
        this._setter(newValue)
    }
}

/***/ }),

/***/ "./src/reactive/effect.js":
/*!********************************!*\
  !*** ./src/reactive/effect.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "effect": () => (/* binding */ effect),
/* harmony export */   "track": () => (/* binding */ track),
/* harmony export */   "trigger": () => (/* binding */ trigger)
/* harmony export */ });
const effectStack = [] // 因为副作用嵌套副作用 会导致外层副作用丢失 所以用个栈记录
let activiteEffect; // 记录当前正在执行的副作用函数 使得effect函数与track，trigger函数串联起来
function effect(fn, options = {}) {
    const effectFn = () => {
        try {
            activiteEffect = effectFn
            effectStack.push(activiteEffect) // 把记录的值都放入栈里面
            return fn() // 副作用首先会执行一次 并且把返回值return 出去
        } finally {
            // activiteEffect = undefined
            effectStack.pop() // 结束就取出最后一个
            activiteEffect = effectStack[effectStack.length - 1] // 让最后一个记录副作用的函数 等于 栈的最后一个值
        }
    }
    if (!options.lazy) {
        effectFn()// 默认执行一次
    }
    effectFn.scheduler = options.scheduler
    return effectFn
}

const targetMap = new WeakMap() // 把activiteEffect存起来 用于存储副作用 且与副总用 和依赖保持一一对应的关系 
//且一个副作用可能依赖多个响应式对象 一个响应式对象可能依赖多个属性 同一个属性又可能被多个副作用依赖 
//因此 weamap应设计成 key:weakmap这种形式
function track(target, key) {// effect对reactive的依赖收集
    if (!activiteEffect) {
        return
    }
    let depsMap = targetMap.get(target)
    console.log(depsMap);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map())) // target 传过来的完整的依赖 key是依赖名
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    dep.add(activiteEffect)
}
function trigger(target, key) { // effect对reactive的更新触发
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return // set 在get里面查找依赖关系 如果没找到就return
    }
    const deps = depsMap.get(key)
    if (!deps) {
        return
    }
    deps.forEach(effectFn => {
        if (effectFn.scheduler) {
            console.log(effectFn.scheduler);
            effectFn.scheduler(effectFn)
        } else {
            effectFn()
        }

    });
}

/***/ }),

/***/ "./src/reactive/reactive.js":
/*!**********************************!*\
  !*** ./src/reactive/reactive.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isReactive": () => (/* binding */ isReactive),
/* harmony export */   "reactive": () => (/* binding */ reactive)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactive/effect.js");



const proxyMap = new WeakMap() // 如果两个不同的变量都依赖相同的副作用 那么 这么两个变量是依赖的同一副作用
function reactive(target) {
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) { // 如果不是对象 就不进行代理 直接返回
        return target
    }
    if (isReactive(target)) { // 就算reactive多个包裹也只看成一个
        return target
    }
    if (proxyMap.has(target)) { // 检查 proxyMap是否有值 有的话 就直接拿出来用
        return proxyMap.get(target)
    }
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '__isReactive') { // 
                return true
            }
            const res = Reflect.get(target, key, receiver)
            ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(target, key)// 收集依赖 要存weakmap
            // return res
            return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res // reactive里面嵌套对象 在收集的时候检查 是否为对象 是的话就递归一下
        },
        set(target, key, value, receiver) {
            let oldLength
            if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(target)) { // 如果是数组 就执行
                oldLength = target.length // 老长度 等于 上一个target传过来的长度
            }
            const oldValue = target[key] // 获取旧值与新值对比
            const res = Reflect.set(target, key, value, receiver)
            if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldValue, value)) { // 如果值没有改变就不触发更新
                (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key)// 更新触发
                if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldLength, target.length)) { // 如果新旧值 不一样就触发
                    (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, 'length')
                }
            }

            return res
        }
    })
    proxyMap.set(target, proxy)
    return proxy
}
function isReactive(target) { // 特例 reactive(reactive(obj)) reactive被多次代理 应该只让他代理一次
    return !!(target && target.__isReactive)
}

/***/ }),

/***/ "./src/reactive/ref.js":
/*!*****************************!*\
  !*** ./src/reactive/ref.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isRef": () => (/* binding */ isRef),
/* harmony export */   "ref": () => (/* binding */ ref)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactive/effect.js");
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive */ "./src/reactive/reactive.js");



function ref(value){
    if(isRef(value)){  // 判断传过来的是否为基础类型
        return value
    }
    return new RefImpl(value) // 如果是对象 就对其进行劫持 交由reactive处理
}
function isRef(value){
    return !!(value && value.__isRef)
}
class RefImpl{
    constructor (value){
        this.__isRef = true
        this._value = convet(value)
    }
    get value(){
        (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this,'value')
        return this._value
    }
    set value(newValue){
        if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(newValue,this._value)){
            this._value = convet(newValue)
            ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this,'value')
        }
        
    }
}
function convet(value){
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value // 如果是对象就reactive一下
}

/***/ }),

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Fragment),
/* harmony export */   "Text": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Text),
/* harmony export */   "h": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.h),
/* harmony export */   "render": () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_1__.render)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");




/***/ }),

/***/ "./src/runtime/render.js":
/*!*******************************!*\
  !*** ./src/runtime/render.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");


function render(vnode, container) { // 由于h函数已经加了shapeFlag的标识 vnode里面就是元素的各个信息 container就是元素
    mount(vnode, container)
}
function mount(vnode, container) {
    const { shapeFlag } = vnode
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT) {
        mountElement(vnode, container)
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
        mountTextNode(vnode, container)
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
        mountFragment(vnode, container)
    } else {
        mountComponent(vnode, container)
    }
}
function mountElement(vnode, container) { // props 就是传过来的第二个参数 
    const { type, props } = vnode
    const el = document.createElement(type)
    mountProps(props, el)
    mountChildren(vnode, el)
    container.appendChild(el)
}
function mountTextNode(vnode, container) {
    const textNode = document.createTextNode(vnode.children)
    container.appendChild(textNode)
}
function mountFragment(vnode, container) {
    mountChildren(vnode, container)
}
function mountComponent(vnode, container) { }
function mountChildren(vnode, container) {
    const { shapeFlag, children} = vnode
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, container)
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
        children.forEach(child => {
            mount(child, container)
        });
    }
}
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/
function mountProps(props, el) {
    for (const key in props) {
        const value = props[key]
        switch (key) {
            case 'class':
                el.className = value
                break;
            case 'style':
                for (const styleName in value) {
                    el.style[styleName] = value[styleName]
                }
                break;

            default:
                if (/^on[^a-z]/.test(key)) {
                    const eventName = key.slice(2).toLowerCase()
                    el.addEventListener(eventName, value)
                } else if (domPropsRE.test(key)) {
                    if (value === '' && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isBoolean)(el[key])) {
                        value = true
                    }
                    el[key] = value
                } else {
                    if (value == null || value === false) {
                        el.removeAttribute(key)
                    } else {
                        el.setAttribute(key, value)
                    }

                }
                break;
        }
    }
}

/***/ }),

/***/ "./src/runtime/vnode.js":
/*!******************************!*\
  !*** ./src/runtime/vnode.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* binding */ Fragment),
/* harmony export */   "ShapeFlags": () => (/* binding */ ShapeFlags),
/* harmony export */   "Text": () => (/* binding */ Text),
/* harmony export */   "h": () => (/* binding */ h)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");


const ShapeFlags = { // 通过位运算 快速找到 虚拟dom类型  text fragment 是唯一类型的
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: (1 << 4) | (1 << 5),
}; 
const Text = Symbol('Text')
const Fragment = Symbol('Fragment')
/**
 * @params {string | Object | Text | Fragment} type
 * @params {Object | null} props
 * @params {string | Array | null} children
 * @return VNode
 */
function h(type, props, children) {// type是元素类型第一个参数 props是传过来第二个参数例如class style children是否有子类子类的个数
    let shapeFlag = 0
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(type)) {
        shapeFlag = ShapeFlags.ELEMENT
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT
    } else {
        shapeFlag = ShapeFlags.COMPONENT
    }
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(children) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return {
        type,
        props,
        children,
        shapeFlag
    }
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hasChanged": () => (/* binding */ hasChanged),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isBoolean": () => (/* binding */ isBoolean),
/* harmony export */   "isFunction": () => (/* binding */ isFunction),
/* harmony export */   "isNumber": () => (/* binding */ isNumber),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isString": () => (/* binding */ isString)
/* harmony export */ });
function isObject(target){
    return typeof target === 'object' && target !== null // 判断是否为对象
}
function hasChanged(oldValue,value){
    return oldValue !== value && !(Number.isNaN(oldValue) && Number.isNaN(value))
}
function isFunction(target){
    return typeof target === 'function'
}
function isString(target){
    return typeof target === 'string'
}
function isNumber(target){
    return typeof target === 'number'
}
function isBoolean(target){
    return typeof target === 'boolean'
}
function isArray(target){
    return Array.isArray(target)
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reactive_computed__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactive/computed */ "./src/reactive/computed.js");
/* harmony import */ var _reactive_effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reactive/effect */ "./src/reactive/effect.js");
/* harmony import */ var _reactive_reactive__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive/reactive */ "./src/reactive/reactive.js");
/* harmony import */ var _reactive_ref__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./reactive/ref */ "./src/reactive/ref.js");
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");







const vnode = (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)(
    'div',
    {
        class: 'a b',
        style: {
            border: '1px solid red',
            fontSize: '14px'
        },
        onClick: () => console.log('click'),
        id: 'foo',
        checked: '',
        custom: false
    },
    [
        (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('ul', null, [
            (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li', { style: { color: 'red' } }, 1),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li', null, 2),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li', { style: { color: 'blue' } }, 3),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)(_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li', null, '4'), (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li')]),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)('li', null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_4__.h)(_runtime__WEBPACK_IMPORTED_MODULE_4__.Text, null, 'hello world')]),
        ])
    ]
)
;(0,_runtime__WEBPACK_IMPORTED_MODULE_4__.render)(vnode, document.body)

// const observer = (window.observer = reactive({
//         count: 0,
//         arr:[1,2,3]
//     }))
// effect(() => {
//     console.log('observer is', observer.count);
// })
// effect(() => {
//     console.log('arr[4] is', observer.arr[4]);
// })
// effect(() => {
//     console.log('arr.length is', observer.arr.length);
// })
// effect(() => {
//     effect(() => {
//         console.log('count1', observer.arr.length);
//     })
//         console.log('arr.length is', observer.arr.length);
//     })


// const foo = (window.foo = ref({a:1}))
// effect(()=>{
//     console.log('ref',foo.value);
// })
const num = (window.num = (0,_reactive_ref__WEBPACK_IMPORTED_MODULE_3__.ref)(2))
const c = (window.c = (0,_reactive_computed__WEBPACK_IMPORTED_MODULE_0__.computed)({
    get(){
        console.log('computed get');
        return num.value * 2
    },
    set(newVal){
        console.log('computed set');
        num.value = newVal
    }
}))
// const c = (window.c = computed(()=>{
//     console.log('computed');
//     return num.value * 2
// }))


})();

/******/ })()
;