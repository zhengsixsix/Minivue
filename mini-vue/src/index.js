
import { computed } from "./reactive/computed";
import { effect } from "./reactive/effect";
import { reactive } from "./reactive/reactive";
import { ref } from "./reactive/ref"
import { Fragment, h, Text, render } from "./runtime";

const vnode = h(
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
        h('ul', null, [
            h('li', { style: { color: 'red' } }, 1),
            h('li', null, 2),
            h('li', { style: { color: 'blue' } }, 3),
            h(Fragment, null, [h('li', null, '4'), h('li')]),
            h('li', null, [h(Text, null, 'hello world')]),
        ])
    ]
)
render(vnode, document.body)

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
const num = (window.num = ref(2))
const c = (window.c = computed({
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

