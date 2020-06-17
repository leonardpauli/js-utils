const noop = ()=> {}
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


// ...

const delay = ms=> new Promise(r=> setTimeout(r, ms||0))


// array

const range = (n)=> Array(n).fill(null).map((_, i)=> i)
const xs_last = xs=> xs[xs.length-1]
const xs_remove = (xs, x)=> {
	const i = xs.indexOf(x)
	if (i>=0) xs.splice(i, 1)
}
const xs_sum = xs=> {
	let sum = 0, i = 0
	for (let i=xs.length-1;i>=0;i--) sum+=xs[i]
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
const xs_overview = (xs, ctx = {unwrap: true})=> {
	const reg = {
		object: [],
		array: [],
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
			reg['undefined'] += 1
		} else if (x===null) {
			reg['null'] += 1
		} else if (type==='object') {
			Array.isArray(x)
				? reg.array.push(x)
				: reg.object.push(x)
		} else if (type==='string') {
			reg.string.push(x)
		} else if (type==='number') {
			reg.number.push(x)
		} else {
			reg.other.push(type)
		}
	}

	// merge

	if (reg.array.length) {
		reg.array = xs_number_overview(reg.array.map(v=> v.length))
	}

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

	if (reg.string.length) reg.string = histogram_inverse_get(histogram_get(reg.string))

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

	return ctx.unwrap && entries.length===1?entries[0][1]:Object.fromEntries(entries)
}

const xs_number_overview = xs=> {
	return xs.reduce(
		(p, n)=> ({
			min: Math.min(p.min, n),
			max: Math.max(p.max, n),
			count: p.count+1,
			sum: p.sum+n,
		}),
		{min: +Infinity, max: -Infinity, count: 0, sum: 0})
}

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



module.exports = {
	identity,
	noop,

	is_object,
	obj_from_obj_list,
	obj_entries_map, obj_map,
	obj_extract,

	delay,

	range, xs_last, xs_remove, xs_sum, xs_concat, xs_group,
	xs_overview, xs_number_overview,

	pad_left, pad_right,

	catch_allow_code,
	error, assert_string,
	json_to_string_or_empty,
}
