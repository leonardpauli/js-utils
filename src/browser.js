const {
	vecStatic,
	interpolate_mapped,
} = require('./math.js')
const {
	obj_from_entries,
	enum_from_csv,
} = require('./misc.js')


const getelrect = e=> ({
	x: e.offsetLeft, y: e.offsetTop,
	w: e.offsetWidth, h: e.offsetHeight,
})

const pointer_new__activation_drag_el = ({rootEl, onChange, activation_drag_el = null})=> ({
	down: false,
	pos: vecStatic.create(), // always current pos
	vel: vecStatic.create(), // last velocity when moving
	prev: [],

	kinds: enum_from_csv('down,up,move'),

	activated: false,
	pos_start: vecStatic.create(),
	_bind_initiated_deinit: null,
	on_change ({e, kind}) {
		const {kinds} = this

		this.do_activate = kind === kinds.down && !this.activated
		this.do_activate_off = kind === kinds.up && this.activated
		// console.log({do_activate: this.do_activate, do_activate_off: this.do_activate_off})

		if (this.do_activate) {
			this.activated = true
			!this._bind_initiated_deinit && (this._bind_initiated_deinit = this.native.bind_initiated(rootEl))
			vecStatic.setv(this.pos_start, this.pos)
			this.prev = []

		}

		if (this.activated) {
			e.preventDefault()
			const curr = [vecStatic.copy(this.pos), new Date()]
			this.prev.push(curr)
			const prev_sample_size = 3
			if (this.prev.length>prev_sample_size) this.prev.shift()

			const prev = this.prev[0]
			if (prev===curr) {
				vecStatic.set(this.vel, 0, 0)
			} else {
				const dt = (curr[1]*1-prev[1]*1)/1000
				vecStatic.setv(this.vel, vecStatic.divk(vecStatic.sub(vecStatic.copy(curr[0]), prev[0]), dt))
				// console.log(this.prev.map(([p, d])=> `${p.x}, ${d*1-new Date()*1}`))
			}
		}

		if (this.do_activate_off) {
			this.activated = false
			this._bind_initiated_deinit && (this._bind_initiated_deinit(), this._bind_initiated_deinit = null)
		}


		onChange(this, e)
	},

	native: {
		mousedown (e) {
			this.down = true
			vecStatic.set(this.pos, e.pageX, e.pageY)
			this.on_change({e, kind: this.kinds.down})
		},
		mouseup (e) {
			this.down = false
			this.on_change({e, kind: this.kinds.up})
		},
		mousemove (e) {
			this.down = e.buttons === 1
			vecStatic.set(this.pos, e.pageX, e.pageY)
			this.on_change({e, kind: this.kinds.move})
		},

		touchstart (e) {
			this.down = true
			const t = e.touches[0]
			vecStatic.set(this.pos, t.pageX, t.pageY)
			this.on_change({e, kind: this.kinds.down})
		},
		touchmove (e) {
			this.down = true
			const t = e.touches[0]
			vecStatic.set(this.pos, t.pageX, t.pageY)
			this.on_change({e, kind: this.kinds.move})
		},
		touchend (e) {
			this.down = false
			this.on_change({e, kind: this.kinds.up})
		},
		touchcancel (e) {
			this.native.touchend(e)
		},

		bind_trigger (el) {

			el.addEventListener('mousedown', this.native.mousedown)
			el.addEventListener('touchstart', this.native.touchstart)

			const unbind = ()=> {

				el.removeEventListener('mousedown', this.native.mousedown)
				el.removeEventListener('touchstart', this.native.touchstart)

			}
			return unbind
		},

		bind_initiated (el) {

			el.addEventListener('mouseup', this.native.mouseup)
			el.addEventListener('mousemove', this.native.mousemove)

			el.addEventListener('touchmove', this.native.touchmove)
			el.addEventListener('touchend', this.native.touchend)
			el.addEventListener('touchcancel', this.native.touchcancel)

			const unbind = ()=> {

				el.removeEventListener('mouseup', this.native.mouseup)
				el.removeEventListener('mousemove', this.native.mousemove)

				el.removeEventListener('touchmove', this.native.touchmove)
				el.removeEventListener('touchend', this.native.touchend)
				el.removeEventListener('touchcancel', this.native.touchcancel)

			}
			return unbind
		},
	},

	init () {
		Object.keys(this.native).map(k=> this.native[k] =
			this.native[k].bind(this))

		this._deinits.push(this.native.bind_trigger(activation_drag_el))
		this._deinits.push(()=> {
			if (this._bind_initiated_deinit) {
				this._bind_initiated_deinit()
				this._bind_initiated_deinit = null
			}
		})

		return this
	},

	_deinits: [],
	deinit () {
		let fn = null
		while ((fn = this._deinits.pop())) {
			fn()
		}
	},
}).init()

module.exports = {
	getelrect,
	pointer_new__activation_drag_el,
}
