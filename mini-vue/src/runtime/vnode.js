import { isArray, isNumber, isString } from "../utils";

export const ShapeFlags = { // 通过位运算 快速找到 虚拟dom类型  text fragment 是唯一类型的
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: (1 << 4) | (1 << 5),
}; 
export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
/**
 * @params {string | Object | Text | Fragment} type
 * @params {Object | null} props
 * @params {string | Array | null} children
 * @return VNode
 */
export function h(type, props, children) {// type是元素类型第一个参数 props是传过来第二个参数例如class style children是否有子类子类的个数
    let shapeFlag = 0
    if (isString(type)) {
        shapeFlag = ShapeFlags.ELEMENT
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT
    } else {
        shapeFlag = ShapeFlags.COMPONENT
    }
    if (isString(children) || isNumber(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return {
        type,
        props,
        children,
        shapeFlag
    }
}