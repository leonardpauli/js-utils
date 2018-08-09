// utils/object-deepAssign.js
// LeonardPauli/js-utils
//
// created by Leonard Pauli, jun-aug 2018
// copyright © Leonard Pauli 2018
//
// towards rim

import sfo, {log} from 'string-from-object'
import {pSymbol, P} from './object'

// TODO: flags: (errors: [], onErrorThrow: true)
// 	populate errors by default, silently continuing
// 	only throws if onErrorThrow: true
// 	(allows reporting multiple errors at once instead of just wasting processed data early)


// OBS: mutating + custom logic for pSymbol
const deepAssign = (target, source, {
	taken = new Set(),
	replaceNonObject = true,
	replaceEmpty = false, // if true, use source = deepAssign(source, target, {replaceEmpty: true}), to get fixed
	replaceEmptyChildren = true,
	replaceNonEmptyAllowed = true,
	errorCtx,
} = {})=> {

	const targetNeedsCastToArray = Array.isArray(source) && !Array.isArray(target)
	if (targetNeedsCastToArray) {
		if (!replaceEmpty) throw new Error(sfo({
			name: 'deepAssign: targetNeedsCastToArray prevented',
			targetNeedsCastToArray, replaceEmpty,
			target, source, ...errorCtx? errorCtx: {}}, 2))
		target = Object.assign([], target)
	}

	const sourceIsPlain = source.constructor===Object || Array.isArray(source)
	if (!sourceIsPlain) return guardNonPlainSource({
		target, source, replaceEmpty, replaceNonObject,
		replaceNonEmptyAllowed, errorCtx,
	}) && source

	// handle list part + list object part
	if (Array.isArray(source)) {
		target.push(...source)
		// TODO: when merging large *pure* arrays, this step is uneccessary;
		// 	any way of detecting that no non-index properties has been added to array instance?
		const sourceObjectPart = Object.keys(source)
			.filter(k=> !(parseInt(k, 10)+''===k && k>=0)) // only non-list items
			.reduce((o, k)=> (o[k] = source[k], o), {})

		return deepAssignInner(target, sourceObjectPart, {
			taken, replaceEmpty: replaceEmptyChildren, replaceNonEmptyAllowed, replaceNonObject, errorCtx})
	}

	// handle object part
	return deepAssignInner(target, source, {
		taken, replaceEmpty: replaceEmptyChildren, replaceNonEmptyAllowed, replaceNonObject, errorCtx})
}

const deepAssignInner = (target, source, {
	taken,
	replaceNonObject,
	replaceEmpty,
	replaceNonEmptyAllowed,
	errorCtx,
	...rest
} = {})=> (Object.keys(source).forEach(k=> {
	// TODO: replaceNonEmptyAllowed
	const v = source[k]
	if (v === target[k]) return

	const vIsObject = v && typeof v === 'object'
	const vIsCircular = vIsObject && taken.has(v)
	if (vIsCircular) return target[k] = v
	if (!vIsObject) {
		guardNonPlainSource({
			target, source, replaceNonObject, replaceEmpty, replaceNonEmptyAllowed,
			errorCtx: errorCtx && {...errorCtx, k}, ...rest})
		return target[k] = v
	}

	// take it
	if (v[pSymbol]) {
		target[k] = P.unwrapRecursive(v)
	} else {
		taken.add(v)
		target[k] = deepAssign(target[k] || {}, v, {
			taken,
			replaceNonObject,
			replaceEmpty,
			replaceEmptyChildren: replaceEmpty,
			replaceNonEmptyAllowed,
			errorCtx,
			...rest,
		})
	}

}), target)


const guardNonPlainSource = ({target, source, replaceNonObject, replaceEmpty, replaceNonEmptyAllowed, errorCtx})=> {
	if (target && typeof target !== 'object' && !replaceNonObject) throw new Error(sfo({
		name: 'deepAssign: destructive replace non-object prevented',
		replaceNonObject,
		target, source, ...errorCtx? errorCtx: {}}, 2))

	const targetEmpty = Object.keys(target).length===0 && (!Array.isArray(target) || target.length===0)

	if (targetEmpty && !replaceEmpty) throw new Error(sfo({
		name: 'deepAssign: replaceEmpty prevented',
		sourceIsPlain: false, targetEmpty, replaceEmpty,
		target, source, ...errorCtx? errorCtx: {}}, 2))
	
	if (targetEmpty || (replaceEmpty && replaceNonEmptyAllowed)) return true

	throw new Error(sfo({
		name: 'deepAssign: destructive merge prevented',
		sourceIsPlain: false, targetEmpty, replaceEmpty, replaceNonEmptyAllowed,
		target, source, ...errorCtx? errorCtx: {}}, 2))
}

export default deepAssign
