import { isFunction } from '../utils';
import { effect, track, trigger } from './effect'
export function computed(getterOrOption) {
    let getter, setter;
    if (isFunction(getterOrOption)) { // 判断是否为函数
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
        this.effect = effect(getter, { // 第一次执行进不去 scheduler函数 当依赖收集完成 会执行 dirty = false 进去scheduler函数 执行更新触发
            lazy: true,     
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true
                    trigger(this, 'value')
                }
            }
        })
    }
    get value() { // 收集依赖的时候执行一下 把dirty变成false 进不去 scheduler
        if (this._dirty) {
            this._value = this.effect()
            this._dirty = false
            track(this, 'value')
        }
        return this._value
    }
    set value(newValue) { // 直接拿到值赋值
        this._setter(newValue)
    }
}