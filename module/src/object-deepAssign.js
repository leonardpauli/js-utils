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
	mergeInsteadOfReplace = false, // for arrays
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
		const replace = !mergeInsteadOfReplace
		if (replace) return source

		target.push(...source)
		// TODO: when merging large *pure* arrays, this step is uneccessary;
		// 	any way of detecting that no non-index properties has been added to array instance?
		const sourceObjectPart = Object.keys(source)
			.filter(k=> !(parseInt(k, 10)+''===k && k>=0)) // only non-list items
			.reduce((o, k)=> (o[k] = source[k], o), {})

		return deepAssignInner(target, sourceObjectPart, {
			taken, replaceEmpty: replaceEmptyChildren, replaceNonEmptyAllowed,
			replaceNonObject, mergeInsteadOfReplace, errorCtx})
	}

	// handle object part

	// const targetEmpty = isEmpty(target)
	// if (targetEmpty && replaceEmpty) return source

	return deepAssignInner(target, source, {
		taken, replaceEmpty: replaceEmptyChildren, replaceNonEmptyAllowed,
		replaceNonObject, mergeInsteadOfReplace, errorCtx})
}

const deepAssignInner = (target, source, {
	taken,
	replaceNonObject,
	replaceEmpty,
	replaceNonEmptyAllowed,
	errorCtx,
	...rest
} = {})=> (Object.keys(source).forEach(k=> {
	const v = source[k]
	if (v === target[k]) return

	// TODO: the logic for resolving circular might not be correct

	const vIsObject = v && typeof v === 'object'
	const vIsCircular = vIsObject && taken.has(v)
	if (vIsCircular) return target[k] = v
	if (!vIsObject) {
		guardNonPlainSource({
			target: target[k], source: v, replaceNonObject, replaceEmpty, replaceNonEmptyAllowed,
			errorCtx: {...errorCtx, k}, ...rest})
		return target[k] = v
	}

	if (v[pSymbol]) return target[k] = P.unwrapRecursive(v)
	
	const targetEmpty = isEmpty(target[k])
	if (targetEmpty && replaceEmpty) return target[k] = v

	if (target[k]) taken.add(target[k])
	return target[k] = deepAssign(target[k] || {}, v, {
		taken,
		replaceNonObject,
		replaceEmpty,
		replaceEmptyChildren: replaceEmpty,
		replaceNonEmptyAllowed,
		errorCtx,
		...rest,
	})
}), target)

const isEmpty = o=> (o===void 0 || o===null) || (typeof o==='object'
	? Object.keys(o).length===0 && (!Array.isArray(o) || o.length===0)
	: false
)

const guardNonPlainSource = ({target, source, replaceNonObject, replaceEmpty, replaceNonEmptyAllowed, errorCtx})=> {
	if (target && typeof target !== 'object' && !replaceNonObject) throw new Error(sfo({
		name: 'deepAssign: destructive replace non-object prevented',
		replaceNonObject,
		target, source, ...errorCtx? errorCtx: {}}, 2))

	const targetEmpty = isEmpty(target)

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
