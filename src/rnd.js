const {range} = require('./misc.js')

const rnd = ()=> Math.random()
const rnd_int = (a=Number.MAX_SAFE_INTEGER, b=null)=> {
	// ()->(int_max), (max)->(0, max), (min, max); min <= x < max
	if (b===null) {
		b = a
		a = 0
	}
	const d = a<b
	const min = d?a:b
	const max = d?b:a
	return min + Math.floor(Math.random()*(max-min))
}
const xs_rnd = xs=> xs[rnd_int(xs.length)]
const capitalize = s=> (s[0]||'').toUpperCase()+s.slice(1)

const vowel = 'aeiou'
const a = 'a'.charCodeAt(0)
const z = 'z'.charCodeAt(0)
const alphabet = range(z-a).map(i=> String.fromCharCode(a+i)).join('')
const consonant = alphabet.split('').filter(a=> vowel.indexOf(a)==-1).join('')

const rnd_word = ()=> range(rnd_int(3, 9)).map(i=> xs_rnd(i%2&&rnd()>0.1?vowel:consonant)).join('')
const rnd_title = (m=5)=> range(rnd_int(2, m)).map(i=> i?rnd_word():capitalize(rnd_word())).join(' ')


module.exports = {
	rnd,
	range,
	rnd_int,
	xs_rnd,
	capitalize,
	rnd_word,
	rnd_title,
}
