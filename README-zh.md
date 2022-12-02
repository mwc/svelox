# svelox

Language: [English](https://github.com/mwc/svelox/README.md) | [简体中文](https://github.com/mwc/svelox/README-zh.md)

## 什么是 svelox？

Svelox 是使对象的 API 兼容 Svelte 的反应式特性，例如数组的 `push`、`splice` 和 `pop` 等 API，调用它们之后，你无需再次使用赋值语句用来触发状态的更新。


## svelox 如何做到自动触发状态更新的？

Svelte 依赖赋值来生成状态更新的代码的，具体参看 Svelte 官网上的[这个](https://svelte.dev/tutorial/updating-arrays-and-objects)例子。

svelox 没有魔法，使用它也需要编写一次类似 `arr = arr` 之类的奇怪赋值语句，因为没有任何方式可以通过编程实现这条语句的相同效果，它必须由 Svelte 编译器生成，且必须是在 `.svelte` 组件文件内编写这一行代码。

svelox 仅仅是让你只需写一次 `arr = arr` 赋值语句而已。

你首先需要编写一个 `updater` 函数，它的函数体一般只需要一句类似 `arr = arr` 的赋值语句即可。
svelox 通过劫持对象的 API（由你决定劫持哪些 API）来实现自动调用 `updater`，以此获得状态更新能力。


## 如何使用？

使用 `npm install` (或 `pnpm install`、`yarn`) 安装 svelox：

```bash
npm install --save-dev svelox
```

svelox 仅导出一个函数 `sx`，它的构造方法说明如下：

```js
function sx(target, updater, methods)

// 调用示例，target 是数组类型，可忽略提供 methods
let arr = sx([1, 2, 3], (n) => arr = n)
```
参数说明：
- `target` 是你的对象，可以是数组也可以是普通对象
- `updater` 一般直接写为 `(n) => arr = n` 即可
- `methods` 需要劫持的函数名称列表，如 `['push', 'splice']`，如果 `target` 是数组可忽略，默认会将改变数组自身的所有API都劫持

返回值 `arr` 实际上是一个 `Proxy` 对象。

`import` 这个 `sx` 函数，下方是一个简单的示例：
```js
<script lang="ts">
    import { sx, type Reactable } from "svelox"

    let numbers: Reactable<number[]> = sx([1, 2, 3], (n) => (numbers = n))
    let value = "";
</script>

<!-- svelte-ignore a11y-autofocus -->
<input autofocus bind:value />
<button disabled={value == ""} on:click={() => numbers.push(parseInt(value, 10))}>add number</button>
<button on:click={() => numbers.reset([4, 5, 6])}>reset to [4, 5, 6]</button>

<h4>numbers:</h4>
<ul>
    {#each numbers as item, index}
        <li>
            <input type="number" bind:value={item} />
            <button on:click={() => numbers.remove(index)}>×</button>
        </li>
    {/each}
</ul>
<button on:click={() => numbers.clear()}>clean all</button>
<h4>sum = {numbers.reduce((s, c) => (s += c), 0)}</h4>
```

[点击此处](https://svelte.dev/repl/0dedb37665014ba99e05415a6107bc21?version=3.53.1)在 Svelte REPL 查看该示例。

你可以看到，使用 `push` 后并不需要再写一句 `numbers = numbers` 之类的赋值语句。

数组会默认劫持下列函数，你无需提供：
- `copyWithin`
- `fill`
- `pop`
- `push`
- `reverse`
- `shift`
- `sort`
- `splice`
- `unshift`

如你所见，这些 API 都会改变数组本身。


## 注意事项

- 调用 `sx(...)` 函数后，原对象已被 `Proxy` 包裹作为返回值返回。
- 所有对象均会添加一个 `reset` 方法，用于重置对象的值。
- 如果对象为 `数组` 类型，则另外增加两个方法：`remove(index)` 用于更便捷地删除指定索引的元素，等同代码是 `splice(index, 1)`，以及 `clear()` 清空数组。
- 你 `不` 应该让指定在 `methods` 内的方法相互调用，这可能会引起死循环。或者在插值表达式中不应该使用添加在 `methods` 中的方法，也会引起死循环。例如，下方示例如果将数组的 `reduce()` 方法添加到 `methods` 列表中，这将引起死循环：
```html
<script>
    import { sx } from "svelox"

    let numbers = sx([1, 2, 3], (n) => (numbers = n), ['reduce'])
</script>

<h4>sum = {numbers.reduce((s, c) => (s += c), 0)}</h4>
```
上述代码中，已在插值表达式中使用 `numbers.reduce` 来计算数组总和，但是同时将 `reduce` 方法添加到 `methods` 列表中，这将导致 `numbers.reduce` 被调用时，自动执行一次 `updater` 方法，也即 `(n) => (numbers = n)`，这使得 `numbers` 被视为脏值，让下方的 `numbers.reduce` 再次执行，如此重复。

## 贡献者

[mwc](https://github.com/mwc),
[tututwo](https://github.com/tututwo)

## License

[MIT](https://github.com/mwc/svelox/license) License (MIT)

Copyright (c) 2022-present, mwc@foxmail.com