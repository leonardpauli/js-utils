const xs_process_with_progress = async (xs, fn, {mod = 10, skip = 0, take = null} = {})=> {
	const {faded: g, reset: n} = ansi
	const itot = take===null? xs.length: Math.min(skip+take, xs.length)

	const felapsed_parts = mst=> {
		// t: total
		st = mst/1000|0
		mt = st/60|0
		ht = mt/60|0
		dt = ht/24|0

		d = dt
		h = ht-dt*24
		m = mt-ht*60
		s = st-mt*60
		ms = mst-st*1000

		return {d, h, m, s, ms}
	}
	const felapsed = ms=> {
		const parts = felapsed_parts(ms)
		let take = false
		const strps = []
		for (const [k, v] of Object.entries(parts)) {
			if (v>0) take = true
			if (!take || k=='ms' && ms>10000) continue
			strps.push(v+k)
		}
		return strps.join('')
	}

	const startd = new Date()
	let i = skip

	const write_progress = ()=> {
		const d = new Date()
		const delta = d*1-startd*1
		const perc = pad_left(''+((i-skip)/(itot-skip)*100).toFixed(2), '100.00'.length)+'%'
		const elapsed = felapsed(delta)
		const etams = startd*1+(itot-skip)/(i-skip)*delta
		const etad = new Date(etams)
		const eta = isNaN(etad.getDate())? '?': etad.toUTCString()

		process.stdout.write(
			`\n${g}${d.toUTCString()}:${n} ${pad_left(''+i, `${itot}`.length)}/${itot}${xs.length!=itot?`/${xs.length}`:''} (${perc}) `
			+`${g}(eta: ${eta}, elapsed ${elapsed})${n}.`)
	}
	write_progress()

	for (; i<itot; i++) {
		const x = xs[i]
		process.stdout.write(`${i}.`)
		const res = await fn(x)
			.then(res=> ({res}))
			.catch(error=> ({error}))
		// TODO: if error.stop_execution?
		if (res.error) console.error(res.error)
		if (i%mod===0) {
			write_progress()
		}
	}
	write_progress()
	process.stdout.write('done\n')
}



const spawn_monitor_last_line = (cmds, {d_rows_count_max = 2} = {})=> {
	// cmds: [['ls', '-lh', '/usr', ...], ...]
	const {spawn} = require('child_process')
	const items = cmds.map(({title, cmd, args = [], env = {}}, i)=> ({
		title: title || `${cmd}.${i}`,
		i, cmd, args, env,
		last_data: '', errors: [],
		closed: false, exit_code: null,
		process: null,
		promise: null,
		d_rows_count_min: 0,
	}))

	const last_data_max = 60000

	const {cyan, red, faded, yellow, reset, green, bold} = ansi


	let top_offset = 0 // ca, slips if other sources writes to buffer
	const update_screen = ()=> {
		const columns_default = 80
		const rows_default = 100
		const columns = process.stdout.columns || columns_default
		const rows = process.stdout.rows || rows_default

		// TODO: assumes col/rows > ~10
		if (columns < 10 || rows < 10) {
			process.stdout.write('window too small')
			return
		}

		// WARN/TODO: does not treat ansi codes as units, might break it
		const str_ellipsis = (s, n, slen=s.length)=> slen>n?s.slice(0, n-3)+'...':s

		const y_size_other = 0
		const y_size_margin = 10
		const box_y_size_max = rows - y_size_margin - y_size_other

		const box = {
			x_padding: 2,
			y_padding: 1,
		}
		box.x_size = columns - 1
		box.y_size = Math.min(items.length*(1+d_rows_count_max) + box.y_padding*2, box_y_size_max)
		box.x_size_content = box.x_size - box.x_padding*2
		box.y_size_content = box.y_size - box.y_padding*2

		const y_size = box.y_size + y_size_other

		let content_rows = 0
		const content = items.map(item=> {
			const status = item.closed? `${item.exit_code===0?green:red}exit(${item.exit_code})${reset}`: `${cyan}running...${reset}`
			
			const error_str_get = c=> `${yellow}error.${item.errors.length-1}${faded}: `+c+reset
			const str_get = xs=> `${bold}${item.title}${reset}: ${xs.filter(Boolean).join(`${faded}, ${reset}`)}`

			let error_str = ''
			if (item.errors.length) {
				const str_len_wo_error = ansi.strip(str_get([status, error_str_get('')])).length
				const available_len = Math.max(0, box.x_size_content - str_len_wo_error)
				const _str = ansi.strip(item.errors[item.errors.length-1].replace(/\n/g, '\\n'))
				error_str = error_str_get(str_ellipsis(_str, available_len))
			}

			const str = str_get([status, error_str])

			const d_rows = item.last_data.split(/\n+/).slice(-d_rows_count_max).filter(Boolean)
			while (d_rows.length < item.d_rows_count_min) d_rows.push('')
			item.d_rows_count_min = d_rows.length

			const content = d_rows.map(t=> {
				const pre = '│ '
				const str = pre+str_ellipsis(t, box.x_size-pre.length, ansi.strip(t).length)+reset
				content_rows += 1
				return str+ansi._go_left(ansi.strip(str).length)+ansi._go_down(1)
			}).join('')

			content_rows += 1
			return ''+str+ansi._go_left(ansi.strip(str).length)+ansi._go_down(1)+content
		}).join('')

		process.stdout.write(
			(top_offset===0
				? range(y_size).fill('\n').join() + ansi._go_up(y_size)
				: ansi._go_up(top_offset))
			+ansi._box({
				w: box.x_size_content,
				h: box.y_size_content,
			})
			+ansi._go_left(box.x_size_content + box.x_padding)
			+ansi._go_up(box.y_size_content)

			+content

			+ansi._go_down(box.y_size_content - content_rows)
			+'\n'
		)
		top_offset = y_size
	}
	update_screen()
	// return {items, promise_all: Promise.resolve()}

	const ondata = item=> data=> {
		item.last_data += data.toString()
		if (item.last_data.length > last_data_max) {
			item.last_data = item.last_data.slice(-last_data_max)
		}
		update_screen()
	}
	const onerror = item=> data=> {
		item.errors.push(data.toString())
		update_screen()
	}
	const onclose = item=> code=> {
		item.closed = true
		item.exit_code = code
		update_screen()
		item._promise_resolve(0)
	}

	for (const item of items) {
		item.process = spawn(item.cmd, item.args, {env: {...process.env, ...item.env}})
		item.process.stdout.on('data', ondata(item))
		item.process.stderr.on('data', onerror(item))
		item.process.on('close', onclose(item))
		item.promise = new Promise((resolve)=> item._promise_resolve = resolve)
	}

	return {items, promise_all: Promise.all(items.map(a=> a.promise))}
}



module.exports = {
	xs_process_with_progress,
	spawn_monitor_last_line,
}
