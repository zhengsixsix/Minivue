import { isObject,hasChanged } from "../utils"
import { trigger,track} from './effect'
import {reactive} from './reactive'
export function ref(value){
    if(isRef(value)){  // 判断传过来的是否为基础类型
        return value
    }
    return new RefImpl(value) // 如果是对象 就对其进行劫持 交由reactive处理
}
export function isRef(value){
    return !!(value && value.__isRef)
}
class RefImpl{
    constructor (value){
        this.__isRef = true
        this._value = convet(value)
    }
    get value(){
        track(this,'value')
        return this._value
    }
    set value(newValue){
        if(hasChanged(newValue,this._value)){
            this._value = convet(newValue)
            trigger(this,'value')
        }
        
    }
}
function convet(value){
    return isObject(value) ? reactive(value) : value // 如果是对象就reactive一下
}