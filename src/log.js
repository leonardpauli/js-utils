const {performance} = require('perf_hooks')
const {ansi} = require('./ansi.js')

const dlog = (o)=> {
	const {at, ...rest} = typeof o==='string'?{at: o}:o
	const {faded: g, reset: n} = ansi
	try {
		console.log(`${g}${new Date().toUTCString()}${n} ${at}: ${g}${JSON.stringify(rest)}${n}`)
	} catch (e) {
		console.dir({at, ...rest})
	}
}

// TODO: use https://nodejs.org/api/perf_hooks.html#perf_hooks_performance_now
// 	(PerformanceObserver, with .mark for existing tooling support?)
let t = performance.now()
dlog.time = o=> {
	const {where, ...rest} = typeof o==='string'?{where: o}:o
	return dlog({where, t: (-t + (t = performance.now())).toPrecision(3), ...rest})
}

module.exports = {
	dlog,
}
