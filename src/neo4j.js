// const neo4j = require('neo4j-driver')
const {load_action_field} = require('./server_action.js')

const get = (neo4j)=> {
	const session_setup = ({config, deinit})=> {
		const {url, pass, user} = config
		const driver = neo4j.driver(url, neo4j.auth.basic(user, pass))
		
		const session = driver.session()
		deinit.add(()=> {
			console.log('closing neo4j connection...')
			return session.close()
		})

		return session
	}

	const execute_to_objects = async (session, query, object={})=> {
		const res = await session.run(query, object)

		const fix_obj = o=> {
			for (const [k, v] of Object.entries(o)) {
				if (neo4j.isInt(v)) {
					if (!neo4j.integer.inSafeRange(v)) {
						console.warn('execute_to_objects.uses lossy conversion to number', k, v)
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

	const server_action_type_raw = ({session_get})=> ({
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
				const session = session_get(ctx)
				const res_raw = await execute_to_objects(session, ctx.action.query, param)
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
		server_action_type_raw,
		session_setup,
		execute_to_objects,
	}
}


module.exports = get
