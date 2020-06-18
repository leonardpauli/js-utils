// app/node/streams/utils.js
// LeonardPauli/docs
// Created by Leonard Pauli, 31 may 2018

const {Transform} = require('stream')

const toLines = ({
	delemitter = /\r?\n/,
	last = null,
	skipEmptyLast = true,
} = {})=> new Transform({
	readableObjectMode: true,
	transform (chunk, _encoding, cb) { // use Decode from ./modules/split?
		const xs = chunk.toString().split(delemitter) // better to manually split and do this.push for each part?
		;(xs[0] = (last || '')+xs[0], last = xs.pop(), xs).map(t=> this.push(t))
		cb(null)
	},
	final (cb) {
		typeof last==='string' && (!skipEmptyLast || last.length) && this.push(last)
		cb(null)
	},
})

// eg. JSON.parse(await streamToString(fs.createReadStream(..., 'utf-8'))) ...
const streamToString = (stream, {last = ''} = {})=> new Promise((resolve, reject)=> stream
	.on('data', c=> last += c.toString())
	.on('end', ()=> resolve(last))
	.on('error', err=> reject(err))
)

const streamReduce = (stream, aggregator, fn)=> new Promise((resolve, reject)=> stream
	.on('data', c=> fn(aggregator, c))
	.on('end', ()=> resolve(aggregator))
	.on('error', err=> reject(err))
)

const streamEnd = (stream)=> new Promise((resolve, reject)=> stream
	.on('end', ()=> resolve())
	.on('error', err=> reject(err))
)

const mapChunks = (fn, {
	readsObj = true,
	writesObj = true,
} = {})=> new Transform({
	writableObjectMode: readsObj,
	readableObjectMode: writesObj,
	transform: async (chunk, _, cb)=> cb(null, await fn(chunk)),
})

const mapChunksPush = (fn, {
	readsObj = true,
	writesObj = true,
	final = (_null, push, done)=> { done(null) },
} = {})=> new Transform({
	writableObjectMode: readsObj,
	readableObjectMode: writesObj,
	transform (chunk, _, cb) {
		fn(chunk, this.push.bind(this), cb)
	},
	final (cb) {
		fn(null, this.push.bind(this), cb)
	},
})

const linesToTsvObjects = ({header = null, i = 0, skip_first = 0, take_max = null} = {})=>
	mapChunks(s=> {
		if (i++<skip_first) return void 0
		if (take_max && i>=take_max) return void 0
		const cs = s.split('\t')
		if (!header) {
			header = cs
			return void 0
		}
		return header.reduce((obj, key, i)=> (obj[key] = cs[i] || null, obj), {})
	})

const csv_line_regex = /("((\\"|[^"])*)"|([^",]*))(,|$)/ig
const linesToCsvObjects = ({header = null, i = 0, skip_first = 0, take_max = null} = {})=>
	mapChunks(s=> {
		if (i++<skip_first) return void 0
		if (take_max && i>=take_max) return void 0
		const cs = [...s.matchAll(csv_line_regex)].map(a=> a[2] || a[4] || '')
		// TODO: parsing of \\n in "quoted \n value"?
		if (!header) {
			header = cs[cs.length-1]?cs:(cs.pop(), cs)
			return void 0
		}
		return header.reduce((obj, key, i)=> (obj[key] = cs[i] || null, obj), {})
	})

const streamToTsvObjects = (stream, opt = {})=> stream
	.pipe(toLines())
	.pipe(linesToTsvObjects(opt))

const toJSONStringifiedLines = ()=>
	mapChunks(s=> JSON.stringify(s)+'\n', {writesObj: false})

const sleep = ms=> new Promise(r=> setTimeout(r, ms))

module.exports = {
	toLines, mapChunks, mapChunksPush,
	streamReduce, streamEnd,
	linesToTsvObjects, streamToTsvObjects,
	linesToCsvObjects,
	toJSONStringifiedLines, streamToString,
	sleep,
}
