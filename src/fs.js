const fs = require('fs')


const fs_dir_ensure = dir=> fs.promises.mkdir(dir)
	.catch(e=> e.code==='EEXIST'?null:Promise.reject(e))
const fs_stats = path=> fs.promises.stat(path)
	.catch(e=> e.code==='ENOENT'?false:Promise.reject(e))

const fs_json_file_read = async (filename)=> {
	const text = await fs.promises.readFile(filename, 'utf8')
	const json = JSON.parse(text)
	return json
}


module.exports = {
	fs_dir_ensure, fs_stats, fs_json_file_read,
}
