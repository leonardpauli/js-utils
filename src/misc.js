const noop = ()=> {}


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

const obj_map = (o, fn)=> Object.fromEntries(Object.entries(o).map(([k, v])=> [k, fn(v, k)]))


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
const pad_left = (s, n, char=' ')=>
	Array(Math.max(0, n-(s+'').length)).fill(char).join('')+s
const pad_right = (s, n, char=' ')=>
	s+Array(Math.max(0, n-(s+'').length)).fill(char).join('')



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
	noop,

	is_object,
	obj_from_obj_list,
	obj_map,
	obj_extract,

	delay,

	range, xs_last, xs_remove, xs_sum, xs_concat,
	pad_left, pad_right,

	catch_allow_code,
	error, assert_string,
	json_to_string_or_empty,
}
