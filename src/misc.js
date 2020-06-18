const noop = ()=> { /* noop */ }
const identity = v=> v


const is_object = v=> v && typeof v==='object'

const obj_from_obj_list = ({list, id_key, obj = {}, handler = null})=> {
	list.forEach((o, i)=> {
		const id = o[id_key]
		if (id in obj) throw new Error(`obj_from_obj_list.id.duplicate (${i}: ${id})`)
		obj[id] = o
		handler && handler(o)
	})
	return obj
}

const obj_entries_map = (xs, fn)=> Object.fromEntries(xs.map(([k, v])=> [k, fn(v, k)]))
const obj_map = (o, fn)=> obj_entries_map(Object.entries(o), fn)
const obj_map_values = (obj, fn, to={})=> {
	for (const [k, v] of Object.entries(obj)) {
		to[k] = fn(v)
	}
	return to
}


// warn: assumes non-circular
// eg. ctx = {}; rest_target = obj_extract({
// 	template: {name: (v, ctx)=> ctx.name = v, sub: {a: noop}},
// 	source: {name: 'Anna', sub: {a: 1, b: 2}},
// 	ctx,
// }); console.dir({ctx, rest_target})
const obj_extract = ({template, source, ctx, rest_target = {}})=> {
	if (is_object(source)) {

		const source_keys = Object.keys(source)
		Object.keys(template).map(k=> {
			xs_remove(source_keys, k)
			const handler = template[k]
			const v = source[k]

			if (typeof handler==='function') {
				handler(v, ctx)
			} else if (typeof handler==='object') {
				obj_extract({template: handler, source: v, ctx, rest_target: rest_target[k] = {}})
				if (Object.keys(rest_target[k]).length===0) delete rest_target[k]
			} else throw new Error(`unknown handler type (${typeof handler}, ${k})`)
		})

		source_keys.map(k=> {
			rest_target[k] = source[k]
		})

	}
	return rest_target
}

const obj_from_entries = xs=> {
	const obj = {}
	for (const x of xs) {
		const [k, v] = x
		obj[k] = v
	}
	return obj
}

const enum_from_csv = s=> obj_from_entries(s.split(',').map((k, i)=> [k, i]))


// ...

const delay = ms=> new Promise(r=> setTimeout(r, ms||0))

const debounce = (ms=300)=> fn=> {
	let t = null
	return function (...args) {
		if (t) clearTimeout(t)
		t = setTimeout(()=> {
			t = null
			fn.call(this, ...args)
		}, ms)
	}
}


// array

const range = (n)=> Array(n).fill(null).map((_, i)=> i)
const xs_last = xs=> xs[xs.length-1]
const xs_remove = (xs, x)=> {
	const i = xs.indexOf(x)
	if (i>=0) xs.splice(i, 1)
}
const xs_sum = xs=> {
	let sum = 0, i = 0
	for (let i=xs.length-1; i>=0; i--) sum+=xs[i]
	return sum
}
const xs_concat = xss=> {
	const ys = []
	for (const xs of xss) ys.push(...xs)
	return ys
}
const xs_group = (xs, {
	key_get = o=> o,
	group_make = k=> [],
	item_add = (group, x)=> group.push(x),
} = {})=> {
	const groups = new Map()
	for (const x of xs) {
		const k = key_get(x)
		if (!groups.has(k)) groups.set(k, group_make(k))
		const group = groups.get(k)
		item_add(group, x)
	}
	return groups
}
const pad_left = (s, n, char=' ')=>
	Array(Math.max(0, n-(s+'').length)).fill(char).join('')+s
const pad_right = (s, n, char=' ')=>
	s+Array(Math.max(0, n-(s+'').length)).fill(char).join('')



// WARN: assumes non-cyclic
const xs_overview = (xs, ctx = {unwrap: true, string_limit: 0}, {unwrap_outer = null}={})=> {
	const reg = {
		object: [],
		array: [],
		date: [],
		string: [],
		number: [],
		undefined: 0,
		null: 0,
		other: [],
	}

	// aggregate
	for (const x of xs) {
		const type = typeof x
		if (x===void 0) {
			// eslint-ignore-next-line dot-notation
			reg['undefined'] += 1
		} else if (x===null) {
			// eslint-ignore-next-line dot-notation
			reg['null'] += 1
		} else if (type==='object') {
			if (Array.isArray(x)) {
				reg.array.push(x)
			} else if (x instanceof Date) {
				reg.date.push(x)
			} else {
				reg.object.push(x)
			}
		} else if (type==='string') {
			reg.string.push(x)
		} else if (type==='number') {
			reg.number.push(x)
		} else {
			reg.other.push(type)
		}
	}

	// merge

	if (reg.object.length) {
		const obj = {}
		for (const x of reg.object) {
			for (const [k, v] of Object.entries(x)) {
				if (!obj[k]) obj[k] = []
				obj[k].push(v)
			}
		}
		reg.object = obj_map(obj, v=> xs_overview(v, ctx))
	}

	if (reg.array.length) {
		const stats = xs_number_overview(reg.array.map(v=> v.length))
		const array = xs_overview(xs_concat(reg.array), ctx, {unwrap_outer: false})
		reg.array = array
		reg.array.stats = stats
	}

	if (reg.date.length) {
		const mss = reg.date.map(v=> v*1)
		const non_nan = mss.filter(m=> !isNaN(m))
		const stats = xs_number_overview(non_nan)
		const nan_count = mss.length-non_nan.length
		if (nan_count) stats.faulty = nan_count
		stats.min = new Date(stats.min)
		stats.max = new Date(stats.max)
		delete stats.sum
		reg.date = stats
	}

	if (reg.string.length) reg.string = histogram_inverse_get(histogram_get(
		ctx.string_limit?reg.string.slice(0, ctx.string_limit):reg.string))

	if (reg.number.length) reg.number = xs_number_overview(reg.number)

	if (reg.other.length) reg.other = Object.fromEntries([
		...histogram_inverse_get(histogram_get(reg.other))])

	// extract
	const entries = Object.entries(reg).filter(([k, v])=> {
		if (v===0) return false
		if (v && typeof v === 'object') {
			return Array.isArray(v)? v.length>0
				: Object.keys(v).length>0
		}
		return true
	})

	return (unwrap_outer!==null?unwrap_outer:ctx.unwrap) && entries.length===1
		? entries[0][1]
		: Object.fromEntries(entries)
}

const xs_number_overview = xs=> xs.reduce(
	(p, n)=> ({
		min: Math.min(p.min, n),
		max: Math.max(p.max, n),
		count: p.count+1,
		sum: p.sum+n,
	}),
	{min: +Infinity, max: -Infinity, count: 0, sum: 0})

const histogram_get = (xs, {key_get = identity} = {})=> {
	const groups = xs_group(xs, {key_get})
	const histogram = Object.fromEntries([...groups]
		.map(([k, v])=> [k, v.length]))
	return histogram
}

const histogram_inverse_get = (histogram)=> {
	const xs = Object.entries(histogram)
	const groups = xs_group(xs, {key_get: v=> v[1]})
	const res = Object.fromEntries([...groups]
		.map(([count, xs])=> [count, xs.map(v=> v[0])]))
	return res
}



// ...

const catch_allow_code = code=> err=> err.code===code?null:Promise.reject(err)

const error = ({at, ...rest})=> {
	// const reststr = Object.entries(obj_map(rest, json_to_string_or_empty))
	// 	.map(([k, v])=> `${k}: ${v}`).join('\n\t')
	// const post = reststr? `; \n\t${reststr}`: ''
	const post = ''
	const err = new Error(`${at}${post}`)
	// Object.assign(err, rest)
	err.data = rest
	return err
}
const assert_string = ({at, ...rest})=> {
	const type = typeof Object.values(rest)[0]
	const expected = 'string'
	if (type !== expected) throw error({at, ...rest, type, expected})
}

const json_to_string_or_empty = raw=> {
	try {
		return JSON.stringify(raw)
	} catch (e) {
		return void 0
	}
}



// serializer

const circular_json_serializer = (()=> {

	const encode = (v, refs)=> {
		if (!is_object(v)) return v
		if (refs.has(v)) return {$: refs.get(v)}
		const is_array = Array.isArray(v)
		const flat = is_array?[]:{}
		const ref = refs.list.push(flat)-1
		refs.set(v, ref)
		is_array
			? v.forEach(v=> flat.push(encode(v, refs)))
			: obj_map_values(v, v=> encode(v, refs), flat)
		return {$: ref}
	}

	const decode = (v, refs)=> {
		if (!is_object(v)) return v
		const id = v.$
		if (refs.taken.has(id)) return refs.taken.get(id)
		const flat = refs[id]
		const is_array = Array.isArray(flat)
		const obj = is_array?[]:{}
		refs.taken.set(id, obj)
		is_array
			? flat.forEach(v=> obj.push(decode(v, refs)))
			: obj_map_values(flat, v=> decode(v, refs), obj)
		return obj
	}

	const circular_to_json = v=> {
		const refs = new Map() // raw: id
		refs.list = [] // id: flat
		const root = encode(v, refs)
		return {v: root, refs: refs.list}
	}

	const circular_from_json = json=> {
		const {v, refs} = json
		refs.taken = new Map() // id: obj
		const root = decode(v, refs)
		return root
	}

	return {
		circular_from_json,
		circular_to_json,
	}
})()



module.exports = {
	identity,
	noop,

	is_object,
	obj_from_obj_list,
	obj_entries_map, obj_map, obj_map_values,
	obj_extract,
	obj_from_entries,
	enum_from_csv,

	delay,
	debounce,

	range, xs_last, xs_remove, xs_sum, xs_concat, xs_group,
	xs_overview, xs_number_overview,

	pad_left, pad_right,

	catch_allow_code,
	error, assert_string,
	json_to_string_or_empty,

	circular_json_serializer,
}
