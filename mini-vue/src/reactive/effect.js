const effectStack = [] // 因为副作用嵌套副作用 会导致外层副作用丢失 所以用个栈记录
let activiteEffect; // 记录当前正在执行的副作用函数 使得effect函数与track，trigger函数串联起来
export function effect(fn, options = {}) { // 收集computed的函数
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
export function track(target, key) {// effect对reactive的依赖收集
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
export function trigger(target, key) { // effect对reactive的更新触发
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