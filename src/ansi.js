const {range, pad_right} = require('./misc.js')

const ansi = ({
	_esc: '\033', // \u001b \\e '\x1b['
	init () {
		// see https://github.com/nyteshade/node_csi/blob/master/lib/csi.js

		const {_esc: esc} = this

		const csi = '\x1b['
		const cmd = code=> `${csi}${code}m`

		// this._table = range(130).map(i=> {
		// 	const code = pad_left(''+i, 2, '0')
		// 	const _str = pad_right(` \\033[${code}m`, 10, ' ')
		// 	const str = `${cmd(code)}${ _str }${cmd(0)} `
		// 	return (i%10?'':'\n')+str
		// }).join('')

		// note: blink only supported in some terminals
		// note: terminal colors may vary with user profile
		// 	prefer: reset, bold, faded, (color)_bg+bold
		this._tag = (t, color='gray', padw=5)=> `${this[color+'_bg']}${this.black}${this.bold} ${pad_right(String(t), padw, ' ')} ${this.reset}`

		const fn00 = 'reset bold faded italic underline blink blink_fast inverse _ _'.split(' ')
		const fn10 = range(10).map(i=> `font${i}`)
		const fn20 = fn00.map(k=> `${k}_off`)
		const fg30 = 'black red green yellow blue magenta cyan white'.split(' ')
		const bg40 = fg30.map(k=> `${k}_bg`)
		const fn50 = '_ framed encircled overline framed_off overline_off _ _ _ _'.split(' ')
		const __60 = range(10).fill('_')
		const __70 = range(10).fill('_')
		const __80 = range(10).fill('_')
		const fg90 = fg30.map(k=> `${k}_bright`)
		const bg100 = fg30.map(k=> `${k}_bright_bg`)

		this._table = [fn00, fn10, fn20, fg30, bg40, fn50, __60, __70, __80, fg90, bg100]

		this._table.map((xs, i10)=> xs.map((k, i)=> { this[k] = `${csi}${i10*10+i}m` }))

		this._guide = this._table.map(xs=> {
			return xs.map((k, i)=> {
				const v = this[k]
				return `${v} ${pad_right(k, 18, ' ')} ${this.reset} `
			}).join('')
		}).join('\n')

		const go_ks = 'up down right left _ _ _ _ column position _ screen_clear line_clear'.split(' ')

		const A = 'A'.charCodeAt(0)
		const _go = {}
    go_ks.map((k, i)=> _go[k] = String.fromCharCode(A+i))
    const {screen_clear, line_clear, column, position, ...go_rest} = _go

		// (0: cursor..line.end, 1: line.start..cursor, 2: line)
		this._line_clear = (c=2)=> `${csi}${c}${line_clear}`
		// (0: cursor..screen.end, 1: screen.start..cursor, 2: screen)
		this._screen_clear = (c=2)=> `${csi}${c}${screen_clear}`
		this._go = (x, y=null)=> y!==null?`${csi}${x};${y}${position}`:`${csi}${x}${column}`
		Object.entries(go_rest).map(([k, v])=> {this[`_go_${k}`] = (n=1)=> n==0?'':`${csi}${n}${v}`})
		
		// | ✔ | ✘ |
		// |▸|▾|▽|▼|▶
		// |◻|◼|☐|☑| ▪|
		// |●|◯|◉|⦿|
		// |❯|
		// ❖◊■▪︎ 
		// |◦|●|
		// |✦|✧|

		// echo -e '\x1b[40;32;1;m OK ✔ \x1b[0m some'

		// │╭╮╯╰─┌┐┘└┏┓┛┗┃━{ sdfsdf }'
		const dk = 'yxabcd'.split('')
		const d0 = '│─╮╭╰╯'
		const d1 = '│─┐┌└┘'
		const d2 = '┃━┓┏┗┛'
		const ds = Object.fromEntries(
			Object.entries({rounded: d0, square: d1, square_bold: d2})
				.map(([k, v])=> [k, Object.fromEntries(v.split('')
					.map((v, i)=> [dk[i], v]))])
		)
		
		this._box = ({w, h, dx = 0, title, variant = ds.rounded, color = this.faded})=> {
			// console.dir({ds,r:this._go_right(0), s:range(w).map(i=> i).join('')})
			const {x,y,a,b,c,d} = variant
			const wm = 1
			const {reset} = this
			return ''
				+this._go_right(dx)
				+color+b+range(w+2*wm).fill(x).join('')+a+reset
				+this._go_down()+this._go_left(w+2*wm+2)
				+range(h).fill(
					color+y+reset
					+range(w+2*wm).fill(' ').join('')
					+color+y+reset
				).join(this._go_down()+this._go_left(w+2*wm+2))
				+this._go_down()+this._go_left(w+2*wm+2)
				+color+c+range(w+2*wm).fill(x).join('')+d+reset

				// +this._go_left(w+1+wm)
				// +this._go_up(h)
				// +'0123456789'
				// +this._go_down(h)
		}
		this._box.ds = ds


		// https://stackoverflow.com/a/29497680/1054573
		const strip_regex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
		this.strip = s=> s.replace(strip_regex, '')

		return this
	},
}).init()



module.exports = {
	ansi,
}
