const vecStatic = {
	create: (x=0, y=x)=> ({x, y}),
	copy: (v)=> ({x: v.x, y: v.y}),
	set: (a, x, y)=> (a.x = x, a.y = y, a),
	setv: (a, v)=> (a.x = v.x, a.y = v.y, a),
	sub: (a, b)=> (a.x -= b.x, a.y -= b.y, a),
	add: (a, b)=> (a.x += b.x, a.y += b.y, a),
	mulk: (a, k)=> (a.x *= k, a.y *= k, a),
	divk: (a, k)=> (a.x /= k, a.y /= k, a),
	mulv: (a, b)=> (a.x *= b.x, a.y *= b.y, a),
	divv: (a, b)=> (a.x /= b.x, a.y /= b.y, a),
	dist: (a, b)=> {
		const {reduce, map, sub, copy} = vecStatic
		return Math.sqrt(reduce(map(sub(copy(a), b), x=> Math.pow(x, 2)), (x, y)=> x+y))
	},
	map: (a, fn)=> (a.x = fn(a.x), a.y = fn(a.y), a),
	apply: (a, fnx, fny)=> (a.x = fnx(a.x), a.y = fny(a.y), a),
	reduce: (a, fn)=> fn(a.x, a.y),
}

const keepInPlace = ({vmin = 0, vmax = 0, hardness = 0.1} = {})=> v=> {
	const hard = Math.max(vmin, Math.min(v, vmax))
	const diff = v - hard
	return hard + diff*hardness
}


const _test = (tests)=> {
	const res = tests.map((fn, i)=> {
		const [result, expected] = fn()
		if (result!==expected) return {i, result, expected, fn: fn.toString().slice(0, 100)}
		return null
	})
	const failed = res.filter(Boolean)
	if (failed.length) {
		// eslint-disable-next-line no-console
		console.log(res.map(v=> v?JSON.stringify(v):'').join('\n'))
	} else {
		// eslint-disable-next-line no-console
		console.log('all passed')
	}
	return failed
}

const interpolate = (a_in, b_in, a_out, b_out, v_in)=> {
	const size_in = b_in-a_in
	const size_out = b_out-a_out
	const size_v_in = v_in-a_in
	const size_v_in_norm = size_v_in/size_in
	const size_v_out = size_v_in_norm*size_out
	const v_out = size_v_out+a_out
	return v_out
}

/*
test([
	()=> [interpolate(0, 1, 0, 3, 0.5), 1.5],
	()=> [interpolate(0, 1, 2, 3, 0.5), 2.5],
	()=> [interpolate(10, 20, 5, 9, 12.5), 6],
	()=> [interpolate(10, 20, 5, 9, 22.5), 10],
	()=> [interpolate(10, 20, 5, 9, 7.5), 4],
	()=> [interpolate(20, 10, 5, 9, 7.5), 10],
	()=> [interpolate(20, 10, 9, 5, 7.5), 4],
	()=> [interpolate(-1, 1, 0, 3, 0), 1.5],
	()=> [interpolate(-1, 1, -6, 3, -2), -10.5],
])
*/

// interpolate a value between one "1d path" and another
const interpolate_mapped = (points_in, points_out, value_in)=> {
	let idx = points_in.findIndex(r=> value_in<r)
	const is_after_last = idx === -1
	const is_last = idx === points_in.length-1
	idx = is_after_last || is_last? points_in.length-1 : idx+1

	const prev_in = points_in[idx-1]
	const next_in = points_in[idx]
	const prev_out = points_out[idx-1]
	const next_out = points_out[idx]
	return interpolate(prev_in, next_in, prev_out, next_out, value_in)
}

/*
// TODO: test with non-equal range sizes
const scores = [0.5, 1, 2, 3, 3.5], view = [100,150,250,350,400]
test([
	()=> [interpolate_mapped(scores, view, 2.5), 300],
	()=> [interpolate_mapped(scores, view, 3.5), 400],
	()=> [interpolate_mapped(scores, view, 3.25), 375],
	()=> [interpolate_mapped(scores, view, 5), 550],
	()=> [interpolate_mapped(scores, view, 0.5), 100],
	()=> [interpolate_mapped(scores, view, 0.25), 75],
	()=> [interpolate_mapped(scores, view, 0), 50],
	()=> [interpolate_mapped(scores, view, -1), -50],
	()=> [interpolate_mapped(view, scores, interpolate_mapped(scores, view, 1.76)), 1.76],
])
*/


module.exports = {
	vecStatic,
	keepInPlace,
	interpolate, interpolate_mapped,
}
