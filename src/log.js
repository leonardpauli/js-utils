const {performance} = require('perf_hooks')
const {ansi} = require('./ansi.js')

// TODO: register for known errors + log stack for unknown
const log_error_stack = false
const is_error = o=> typeof o==='object' && o instanceof Error
const dlog_get = ({pre = '', log = v=> console.log(v)} = {})=> o=> {
	const {at, ...rest} = typeof o==='string'?{at: o}
		: is_error(o)? {at: o.at||'unknown', error: o}
		: o

	let error = null
	if (is_error(rest.error)) {
		if (log_error_stack) {
			error = rest.error
			delete rest.error
		} else {
			if (!rest.data && rest.error.data) rest.data = rest.error.data
			rest.error = rest.error.message
		}
	}
	const {faded: g, reset: n} = ansi
	try {
		const meta_str = JSON.stringify(rest)
		log(`${g}${new Date().toUTCString()}${n} ${pre}${at}${g}${meta_str==='{}'?' ':': '+meta_str}${error?'\n'+error.stack:''}${n}`)
	} catch (e) {
		console.dir({at, ...rest})
	}
}

const dlog = dlog_get()

dlog.error = dlog_get({pre: `${ansi.red}ERROR: ${ansi.reset}`, log: v=> console.error(v)})
dlog.warn = dlog_get({pre: `${ansi.yellow}WARN: ${ansi.reset}`, log: v=> console.warn(v)})


// TODO: use https://nodejs.org/api/perf_hooks.html#perf_hooks_performance_now
// 	(PerformanceObserver, with .mark for existing tooling support?)
let t = performance.now()
dlog.time = o=> {
	const {at, ...rest} = typeof o==='string'?{at: o}:o
	return dlog({at, t: (-t + (t = performance.now())).toPrecision(3), ...rest})
}

module.exports = {
	dlog,
}
