// const neo4j = require('neo4j-driver')
const {dlog} = require('./log.js')
const {load_action_field} = require('./server_action.js')
const {delay} = require('./misc.js')

const get = (neo4j)=> {
	const driver_setup = (config)=> {
		const {url, pass, user} = config
		const driver = neo4j.driver(url, neo4j.auth.basic(user, pass))
		
		// const session = driver.session()
		// deinit.add(()=> {
		// 	dlog('closing neo4j connection...')
		// 	return session.close()
		// })

		return driver
	}

	const session_use = ({deinit, driver})=> async fn=> {
		// const id = Math.random()
		const session = driver.session()
		// dlog('session made'+id)
		let closing = null
		const done = async ()=> {
			if (!closing) closing = session.close()
			await closing
			// dlog('session closed'+id)
			deinit.remove(done)
		}
		deinit.add(done)
		
		const res = await fn(session)
		await delay(1000)

		await done()
		return res
	}

	const execute_to_objects = async (session, query, object={})=> {
		const res = await session.run(query, object)

		const fix_obj = o=> {
			for (const [k, v] of Object.entries(o)) {
				if (neo4j.isInt(v)) {
					if (!neo4j.integer.inSafeRange(v)) {
						dlog.warn({at: 'execute_to_objects.uses lossy conversion to number', k, v})
					}
					o[k] = neo4j.integer.toNumber(v)
				} else if (typeof v==='object' && v) {
					o[k] = fix_obj(v)
				}
			}
			return o
		}

		return res.records && res.records.map(r=> {
			const o = r.toObject()
			return fix_obj(o)
		}) || []
	}

	const server_action_type_raw = ({session_use})=> ({
		title: 'neo4j_query',
		field_list: [{
			title: 'query',
		}, {
			title: 'param_get',
			default: ()=> ({}),
		}, {
			title: 'handler',
			default: async (ctx)=> {
				const param = ctx.action.param_get(ctx) // TODO: support async
				const _query = ctx.action.query
				const query = typeof _query === 'function'? _query(ctx): _query
				const res_raw = await session_use(ctx)(async session=> execute_to_objects(session, query, param))
				const res = !ctx.action.extractor? res_raw: ctx.action.extractor(ctx, res_raw)
				return res
			},
		}, {
			title: 'extractor',
			default: null,
			// default: (ctx, res)=> res,
		}],
		load (action) {
			load_action_field(this, action)
		},
	})

	return {
		driver_setup,
		session_use,
		server_action_type_raw,
		execute_to_objects,
	}
}


module.exports = get
