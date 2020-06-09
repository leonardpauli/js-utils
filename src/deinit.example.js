const {delay} = require('./utils.js')
const deinit = require('./deinit.js')

// press ctrl-C (SIGINTerupt) after 1.1,
// 	should attempt interupt, but cancel,
// 	and resume (1.2 last) after all "cleanup" is done

const main = async ()=> {
	console.log('1.1: main.start')
	await delay(2000)
	console.log('1.2: main.done')
}

deinit.add(async (code, signal)=> {
	console.log(`2: deinit.1: code: ${code}; signal: ${signal}`)
	await delay(500)
	console.log('4: deinit.1.end')
})
deinit.add(async ()=> {
	console.log('3: deinit.2')
	await delay(1000)
	console.log('5: deinit.2: attempt cancel exit')
	return false
})
deinit.add(()=> console.log('3.1: deinit.3'))

main().catch(console.error)