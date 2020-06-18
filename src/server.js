// TODO: use koa instead

const http = require('http')
const https = require('https')

const handler_not_found = ({res, headers}, _next)=> {
	res.writeHead(404, headers)
	res.end()
}

const server_new = ({
	ssl = false, // or {cert: fs.readFileSync('cert.pem'), key: fs.readFileSync('key.pem')},
	handlers: _handlers,
	base_url = '0.0.0.0',
})=> {
	const handlers = [..._handlers, handler_not_found]

	const scheme = ssl?'https:':'http:'

	const main_handler = (req, res)=> {
		const methods = ['POST', 'GET']
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS, '+methods.join(', '),
			'Access-Control-Allow-Headers': 'Content-Type',
		}

		const status = code=> {
			res.writeHead(code, headers)
			res.end()
		}

		if (req.method==='OPTIONS') return status(204)
		if (!methods.includes(req.method)) return status(405)

		const ok_json = json=> {
			const body = JSON.stringify(json)
			res.writeHead(200, {...headers, 'Content-Type': 'application/json'})
			res.end(body)
		}

		const ctx = {
			req, res,
			headers,
			status,
			get_json () {
				return new Promise((res, rej)=> {
					let data = ''
					this.req.on('data', chunk=> { data+=chunk })
					this.req.on('end', ()=> {
						try {
							res(JSON.parse(data))
						} catch (e) {
							e.code = 400
							rej(e)
						}
					})
				})
			},
			get url () { return new URL(scheme+'//'+base_url+this.req.url) },
			ok_json,
		}

		const next_get = i=> ()=> handlers[i](ctx, next_get(i+1))
		const error = e=> {
			console.log(`${new Date().toUTCString()}: request handler error`+(e.code?': '+e.code+': '+e.message:''))
			if (!e.code) console.error(e)
			ctx.status(e.code || 500)
		}
		try {
			Promise.resolve(next_get(0)()).catch(error)
		} catch (e) {
			error(e)
		}
	}

	const server = ssl
		? https.createServer({...ssl}, main_handler)
		: http.createServer(main_handler)

	return server
}


module.exports = {server_new, handler_not_found}
