// TODO: use node-fetch instead?

const https = require('https')

const post = ({
	method = 'POST',
	json,
	headers,
	...rest
})=> new Promise((resolve, reject)=> {
	const body = JSON.stringify(json)
	http_req({
		method,
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': body.length,
			...headers,
		},
		body,
		...rest
	}).then(res=> {
		let data = ''
		res.on('data', chunk=> {
			data+=chunk
		})
		res.on('end', ()=> {
			const json_res = JSON.parse(data)
			resolve(json_res)
		})
	}).catch(reject)
})

const http_req = ({
	url: __url,
	path = null,
	base_url = null,
	method = 'GET',
	headers = {},
	body = null,
})=> new Promise((resolve, reject)=> {
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
			where: 'post.status',
			what: url.protocol+'//'+url.host+url.pathname,
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
	post,
	http_req,
}
