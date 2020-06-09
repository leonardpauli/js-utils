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
	const reststr = Object.entries(rest)
		.map(([k, v])=> `${k}: ${v}`).join('\n\t')
	const post = reststr? '; \n\t'+reststr: ''
	const err = new Error(`${at}: error${post}`)
	Object.assign(err, rest)
	return err
}
const assert_string = ({at, ...rest})=> {
	const type = typeof Object.values(rest)[0]
	const expected = 'string'
	if (type !== expected) throw error({at, ...rest, type, expected})
}



module.exports = {
	obj_from_obj_list,
	obj_map,
	delay,

	range, xs_last, xs_remove, xs_sum, xs_concat,
	pad_left, pad_right,

	catch_allow_code,
	error, assert_string,
}
