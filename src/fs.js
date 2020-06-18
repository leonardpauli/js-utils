const fs = require('fs')


const fs_dir_ensure = dir=> fs.promises.mkdir(dir)
	.catch(e=> e.code==='EEXIST'?null:Promise.reject(e))
const fs_dir_ensure_full = async (dir_path)=> {
	// TODO: use require('path') + path components
	const comp = dir_path.split('/')
	let full = comp.shift()
	for (const p of comp) {
		full += '/'+p
		await fs_dir_ensure(full)
	}
	return dir_path
}
const fs_stats = path=> fs.promises.stat(path)
	.catch(e=> e.code==='ENOENT'?null:Promise.reject(e))

const fs_json_file_read = async (filename)=> {
	let text = null
	try {
		text = await fs.promises.readFile(filename, 'utf8')
	} catch (e) {
		if (e.code==='ENOENT') return void 0
		throw e
	}
	const json = JSON.parse(text)
	return json
}


module.exports = {
	fs_dir_ensure, fs_dir_ensure_full,
	fs_stats,
	fs_json_file_read,
}
