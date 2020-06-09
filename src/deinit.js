// created by Leonard Pauli, 7 may 2020
// usage:
// 	const deinit = require('./deinit')
// 	deinit.add((exit_code, signal)=> fs.writeFileSync('./log', 'pending change... (even for forced exits)'))
// 	deinit.add(async (_, signal)=> await db.close()) // might not complete on forced exit
// 	deinit.add(async (_, signal)=> false) // prevent exit (if non-forced, eg. )
// 	// private: deinit.deinit(); deinit.init() // remove handlers + remove the process handlers + add them back


const deinit = {
	// TODO: see https://github.com/jtlapp/node-cleanup
	// TODO: test
	// TODO: see nodejs.uncaughtExceptionMonitor for monitoring
	handlers: [],
	initiated: false,
	add (handler) {
		// handler gets removed when execution starts
		this.init()
		this.handlers.push(handler)
	},
	notify_in_progress: 0,
	notify (exit_code, signal) {
		this.notify_in_progress++
		const errors = []
		const promises = []
		let cancel_exit = false, handler = null
		while ((handler = this.handlers.shift())) {
			try {
				const res = handler(exit_code, signal)
				if (res && res.then) promises.push(
					res.catch(e=> errors.push(e)))
				if (res===false) cancel_exit = true
			} catch (e) {
				errors.push(e)
			}
		}
		this.notify_in_progress--
		return {errors, promises, cancel_exit}
	},
	async notify_async (exit_code, signal) {
		this.notify_in_progress++
		const {errors, promises, cancel_exit} = this.notify(exit_code, signal)
		let _cancel_exit = cancel_exit
		if (promises.length) {
			const res = await Promise.all(promises)
			if (res.some(v=> v===false)) _cancel_exit = true
		}
		if (errors.length) this._write_errors(errors)
		this.notify_in_progress--
		return _cancel_exit
	},
	_write_errors (errors) {
		process.stderr.write(`error during deinit {count: ${errors.length}}:\n${
			errors.map(e=> e.stack).join('\n\n------\n\n')}\n`)
	},
	init () {
		if (this.initiated) return
		this.initiated = true

		const signalHandler = signal=> async ()=> {
			const cancel_exit = await this.notify_async(null, signal)
			if (!cancel_exit) {
				// redo the kill signal, but without our handler to prevent it
				// (+ allows signal to be seen by parent process?)
				this.deinit()
				process.kill(process.pid, signal);
			}
		}

		this._handlers = {
			...Object.fromEntries(
				// see https://nodejs.org/api/process.html#process_signal_events
				// SIGUSR1: reserved by nodejs to start the debugger
				// SIGWINCH: when console is resized
				// SIGUSR2: ??
				// SIGHUP: windows: eg. on window close, ~10s before windows terminates nodejs
				'SIGINT,SIGHUP,SIGQUIT,SIGTERM'.split(',') // see posix signals
				.map(k=> [k, signalHandler(k)])),
			uncaughtException: e=> {
				process.stderr.write(`UncaughtException:\n${e.stack}\n`)
				process.exit(1) // invokes (on exit)
			},
			beforeExit: async ()=> {
				const cancel_exit = await this.notify_async(0, 'exit')
				if (cancel_exit) return
				process.exit(0)
			},
			exit: (exit_code, signal)=> {
				// notify again, if any handlers are lingering (eg. as with forced exit)
				const {errors, promises, cancel_exit} = this.notify(exit_code, signal)
				if (this.notify_in_progress>0) errors.push(new Error(
					'WARN: deinit handler was in progress (possibly killed by a forced exit?)'))
				if (promises.length) errors.push(new Error(
					'WARN: async deinit handlers fully available during forced exit, '
					+'cleanup might not have completed sucessfully'))
				if (cancel_exit) errors.push(new Error(
					'WARN: deinit handler wanted to cancel exit, but unable to cancel a forced exit'))
				if (errors.length) this._write_errors(errors)
			},
		}

		Object.entries(this._handlers).forEach(([event, handler])=> {
			process.on(event, handler)
		})

		return this
	},
	deinit () {
		this.initiated = false
		Object.entries(this._handlers).forEach(([event, handler])=> {
			process.removeListener(event, handler)
		})
		this._handlers = []
	},
	async exit () {
		return this._handlers.beforeExit()
	},
}

module.exports = deinit
