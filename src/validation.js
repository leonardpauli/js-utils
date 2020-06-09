
const type_cast = {
	pos_number: n=> typeof n==='number' && n>0?n:null,
	many_string: o=> Array.isArray(o)?o.filter(x=> typeof x==='string'):[],
	string: s=> typeof s==='string'?s:'',
	obj: o=> typeof o === 'object' && o!==null? o: {},
	obj_get: form=> o=> {
		const raw = type_cast.obj(o)
		return Object.fromEntries(Object.entries(form).map(([k, f])=> [k, f(raw[k])]))
	},
}

module.exports = {type_cast}
