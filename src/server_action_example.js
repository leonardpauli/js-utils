const {server_new} = require('@leonardpauli/utils/src/server.js')
const {
	server_start,
	api_handler,
	action_type_generic,
	action_type_load,
	action_load,
	server_config_default_get,
} = require('@leonardpauli/utils/src/server_action.js')

const config = {
	server: server_config_default_get({root_dir: __dirname}),
}

// TODO: read-in from yaml?, see classio api versioning idea
// TODO: provide safe/authorized versions of these through ctx
const action_list = [{
	title: 'server_heartbeat',
	type: 'generic',
	handler: async (ctx)=> ({
		date: new Date().toISOString(),
	}),
}]

const ctx = {}

const action_type_list = [
	action_type_generic(),
]
const action_type_register = action_type_load(action_type_list)
const action_register = action_load(action_list, action_type_register)

const server = server_new({
	...config.server,
	handlers: [
		api_handler({
			endpoint: '/api',
			ctx_new: ()=> ({...ctx}),
			action_register,
		}),
	],
})

server_start(server, config.server)

// usage:
// node (this file)
// curl 0.0.0.0:3000/api -X POST -w '\n\n%{http_code}\n' -d'{"action":"server_heartbeat"}' # expected: {"date": (iso string)}
// (ctrl-c to stop)
