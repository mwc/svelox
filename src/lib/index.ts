/**
 * 当对象指定的方法被调用时，自动调用该 Updater，它由外部代码提供，
 * 编写 updater 函数请参考下方代码：
 * ``` js
 * let arr = sx([1, 2, 3], (value) => arr = value)
 * ```
 * 
 * @param {T} value 新的值
 */
export type Updater<T> = (value: T) => void

/** 
 * 指定需要自动执行 Updater 函数的方法名称列表，对象为数组时，默认指定了那些会改变函数自身的函数，包括：
 *  copyWithin, fill, pop, push, reverse, shift, sort, splice, unshift
 */
export type Methods = string[] | null | undefined

// 对象值可重置类型
export type Reset<T> = {
	/**
	 * 重置对象的值
	 * @param {T} v 新的值
	 */
	reset: (v: T) => void
}

export type HijackFn = Function & {
	___hijacked?: boolean
}

// 向所有对象附加一个 reset 方法，以使它能够重置其值
export type ObjectAddition<T> = T & Reset<T> & { [K in keyof T]: any }

// 数组对象额外提供 2 个方法，用于简化删除元素和清空数组操作
export type ArrayAddition<T> = ObjectAddition<T> & {
	/**
	 * 删除指定索引的元素，是 Array#splice 更为简短的实现。
	 * 
	 * @param {number} index 待删除的索引
	 */
	remove: (index: number) => any[] | undefined,

	// 清空数组所有元素
	clear: () => void
}

export type Reactable<T extends Object> = T extends any[] ? ArrayAddition<T> : ObjectAddition<T>

/**
 * 使 Svelte 的对象方法支持在其调用时，自动执行一次状态更新
 * 
 * @param {Object} target 目标对象，必须为对象类型
 * @param updater 更新函数，当指定的方法被调用时，将同时调用该函数以执行一次更新
 * @param methods 指定需要自动执行 Updater 函数的方法名称列表，若目标对象为数组，该参数可选，程序将自动指定会改变数组自身的函数（如 push 等）；其他对象该参数必须提供，且 [不] 应指定那些不会改变对象自身的函数，否则会导致死循环。
 */
export function sx<T extends Object>(target: T, updater: Updater<Reactable<T>>, methods: Methods = null): Reactable<T> {
	if (target instanceof Object) {
		let proxy: Reactable<T>

		Object.assign(target, { reset: (newVal: T) => updater(sx(newVal, updater, methods)) })
		const exclude = ['reset']

		if (typeof methods == 'function') {
			updater = methods
			methods = null
		}

		if (typeof updater != 'function') {
			throw new Error('updater must be a function.')
		}

		if (methods == null) {
			methods = Array.isArray(target) ?
				['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'] : []
		}

		if (!Array.isArray(methods) || methods.length == 0) {
			throw new Error('You must specify a list of function names that need to be automatically execute updater.')
		}

		if (Array.isArray(target)) {
			Object.assign(target, {
				remove: (index: number) => ((proxy as any[]).splice(index, 1)),
				clear: () => (target.length = 0, updater(proxy as Reactable<T>))
			})

			exclude.push('remove', 'clear')
		}

		proxy = new Proxy(target, {
			get(obj, p) {
				let prop = obj[p as keyof T] as HijackFn

				if (
					typeof prop == 'function' &&
					p != 'constructor' &&
					!prop.___hijacked &&
					!exclude.includes(String(p)) &&
					methods?.includes(String(p))
				) {
					let fn = obj[p as keyof T] as (Function & { ___hijacked: boolean | undefined });

					// function hijacking
					(obj as any)[p] = (...args: any[]) => [fn.apply(obj, args), updater(proxy as Reactable<T>)][0];
					(obj as any)[p].___hijacked = true
				}

				return obj[p as keyof T]
			}
		}) as Reactable<T>

		return proxy
	}

	throw new Error(`'target' must be an object.`)
}