// TODO: use node-fetch instead?

const {dlog} = require('./log.js')

const https = require('https')

const queryToString = q=> Object.entries(q).map(([k, v])=> encodeURIComponent(k)+'='+(
	Array.isArray(v)
		? v.map(v=> encodeURIComponent(v)).join(',')
		: encodeURIComponent(v) )
	).join('&')

const post = ({
	method = 'POST',
	json,
	headers,
	...rest
})=> new Promise((resolve, reject)=> {
	const body = json===undefined? null: JSON.stringify(json)
	http_req({
		method,
		headers: {
			'Accept': 'application/json',
			...body?{
				'Content-Type': 'application/json',
				'Content-Length': body.length,
			}:{},
			...headers,
		},
		body,
		...rest
	}).then(res=> {
		let data = ''
		res.setEncoding('utf8') // ?
		res.on('data', chunk=> {
			data+=chunk
		})
		res.on('end', ()=> {
			res.json = ()=> JSON.parse(data)
			res.text = ()=> data
			resolve(res)
		})
	}).catch(reject)
})

const http_req = ({
	url: __url,
	path: _path = null,
	query: _query = null, // or string (without "?") or key-value object
	base_url = null,
	method = 'GET',
	headers = {
		// 'Authorization': `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`,
		// 'Authorization': `Bearer ${access_token}`,
		// 'Content-Length': Buffer.byteLength(postData)
	},
	body = null,
})=> new Promise((resolve, reject)=> {
	const query = !_query? null
		: typeof _query==='object'? queryToString(_query)
		: _query
	const path = query?`${_path}?${query}`:_path
	const _url = __url || (base_url+path)
	const url = typeof _url==='string'?new URL(_url):url
	if (url.protocol!=='https:') throw new Error('post url protocol unhandled')

	const options = {
		method,
		headers,
	}

	const req = https.request(url, options, res=> {
		const status = res.statusCode

		dlog({
			at: 'post.status',
			url: url.protocol+'//'+url.host+url.pathname,
			// options,
			status,
		})

		if (status!==200) {
			reject({status, res})
			return
		}

		resolve(res)
	})

	req.on('error', error=> {
		reject(error)
	})

	if (body!==null) req.write(body)
	req.end()
})


module.exports = {
	queryToString,
	post,
	http_req,
}
