const fs = require('fs')
const path = require('path')

const deinit = require('./deinit.js')
const {dlog} = require('./log.js')
const {type_cast} = require('./validation.js')
const {obj_from_obj_list} = require('./misc.js')


const type_cast_body = type_cast.obj_get({
	action: type_cast.string,
	payload: type_cast.obj,
})

const api_handler = ({
	endpoint = '/api',
	ctx_new,
	action_register,
})=> async (ctx, next)=> {
	const match = ctx.req.url===endpoint && ctx.req.method==='POST'
	if (!match) return next()
	const json = await ctx.get_json()
	const {action: action_title, payload} = type_cast_body(json)

	if (!(action_title in action_register)) {
		const err = new Error(`action not found "${action_title.replace(/\n/g, '\\n')}"`)
		err.code = 404
		throw err
	}

	const action = action_register[action_title]
	const _ctx = Object.assign(ctx_new(), {action, payload})
	const res = await action.handler(_ctx)

	ctx.ok_json(res)
}

const server_start = (server, {port, url})=> {
	server.listen(port, ()=> {
		console.log(`listening on ${url}`)
	})
}

const load_ssl = ({required = false, base_dir = __dirname})=> {
	const p = p=> path.join(base_dir, p)
	try {
		return {
			key: fs.readFileSync(p('key.pem')),
			cert: fs.readFileSync(p('cert.pem')),
		}
	} catch (e1) {
		try {
			return {
				key: fs.readFileSync(p('private.key')),
				cert: fs.readFileSync(p('public.crt')),
			}
		} catch (e2) {
			console.error('no ssl certs found at '+p('{key,cert}.pem'))
			if (required) {
				console.error(e1)
				throw e2
			}
		}
		return false
	}
}

const server_config_default_get = ({root_dir = __dirname})=> ({
	port: 3000,
	host: '0.0.0.0',

	ssl: load_ssl({
		required: false,
		base_dir: path.join(root_dir, './ssl'),
	}),

	get url () {
		return `http${this.ssl?'s':''}://${this.host}:${this.port}`
	},

	get base_url () { return this.url },
})



const load_action_field = (action_type, action)=> {
	// populate defaults / field validation
	action_type.field_list.map(f=> {
		if (!(f.title in action)) {
			if (f.default === undefined) {
				throw new Error(`action_type.load_action.missing required field "${f.title}"`)
			}
			action[f.title] = f.default
		}
	})
}


const action_type_generic = ()=> ({
	title: 'generic',
	field_list: [{
		title: 'handler',
		// default: async (ctx)=> {}, // required
	}],
	load (action) {
		load_action_field(this, action)
	},
})

const action_type_load = xs=> obj_from_obj_list({
	list: xs,
	id_key: 'title',
	handler: o=> {
		o.field = obj_from_obj_list({
			list: o.field_list,
			id_key: 'title',
		})
	},
})

const action_load = (xs, action_type_register)=> obj_from_obj_list({
	list: xs,
	id_key: 'title',
	handler: o=> {
		if (typeof o.type==='string') {
			const match = action_type_register[o.type]
			if (!match) throw new Error(`no action type registred for name "${o.type}"`)
			o.type = match
		}
		if (!(typeof o.type==='object' && o.type))
			throw new Error(`no type for action "${o.title}"`)

		o.type.load(o)
	},
})


module.exports = {
	action_load,
	action_type_load,
	load_action_field,
	action_type_generic,
	server_config_default_get,
	load_ssl,
	api_handler,
	server_start,
}
