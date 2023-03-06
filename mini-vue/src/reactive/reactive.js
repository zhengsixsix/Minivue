import { hasChanged, isArray, isObject } from "../utils";
import { track, trigger } from './effect'

const proxyMap = new WeakMap() // 如果两个不同的变量都依赖相同的副作用 那么 这么两个变量是依赖的同一副作用
export function reactive(target) {
    if (!isObject(target)) { // 如果不是对象 就不进行代理 直接返回
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
            track(target, key)// 收集依赖 要存weakmap
            // return res
            return isObject(res) ? reactive(res) : res // reactive里面嵌套对象 在收集的时候检查 是否为对象 是的话就递归一下
        },
        set(target, key, value, receiver) {
            let oldLength
            if (isArray(target)) { // 如果是数组 就执行
                oldLength = target.length // 老长度 等于 上一个target传过来的长度
            }
            const oldValue = target[key] // 获取旧值与新值对比
            const res = Reflect.set(target, key, value, receiver)
            if (hasChanged(oldValue, value)) { // 如果值没有改变就不触发更新
                trigger(target, key)// 更新触发
                if (hasChanged(oldLength, target.length)) { // 如果新旧值 不一样就触发
                    trigger(target, 'length')
                }
            }

            return res
        }
    })
    proxyMap.set(target, proxy)
    return proxy
}
export function isReactive(target) { // 特例 reactive(reactive(obj)) reactive被多次代理 应该只让他代理一次
    return !!(target && target.__isReactive)
}