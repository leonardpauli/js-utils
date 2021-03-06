// utils/object.test.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve, P,
	objectMap, objectMapRecursive,
	objectKeyDotNotationResolveShallow,
} from './object'
import {expectDeepSubsetMatch} from './testUtils'


describe('P.unwrap', ()=> {
	it('some', ()=> {
		const o = {a: 1}
		const p = P(o)
		expect(p.b.c).toEqual({})
		expect(o.b.c).toEqual({})
		p.b.d = 7
		expect(p.b.d).toEqual(7)
		expect(o.b.d).toEqual(7)
		expect(p).not.toBe(o)
		// expect(P.unwrap(p)).toBe(P.unwrap(p))
		// expect(P.unwrap(o)).toBe(P.unwrap(o))
		expect(P.unwrap(p)).toBe(o)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('recursive manual detatched add', ()=> {
		const o = {a: 1}
		const o2 = {b: 1}
		const p = P(o)
		const p2 = P(o2)
		p.o2 = p2
		p.o2.x = 5

		expect(p.o2).not.toBe(o2)
		expect(P.unwrap(p).o2).not.toBe(o2)
		expect(P.unwrapRecursive(p).o2).toBe(o2)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('recursive', ()=> {
		const o2 = {b: 1}
		const o = {a: 1, o2}
		const p = P(o)
		p.o2.x = 5

		expect(p.o2).not.toBe(o2)
		expect(P.unwrapRecursive(p).o2).toBe(o2)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('multiple same', ()=> {
		const fn = (s, {expr} = s)=> ({
			expr: {description: 'expression'},
			lexems: [expr],
			paren: {expr},
			paren2: {expr},
			lexems2: [expr],
			paren3: {expr},
			paren4: {expr},
		})
		const r = stupidIterativeObjectDependencyResolve(fn, {n: 1})
		// log(r)
		expect(r.expr).toBe(r.paren.expr)
		expect(r.expr).toBe(r.lexems[0])
	})
})

describe('stupidIterativeObjectDependencyResolve', ()=> {
	const declarative = stupidIterativeObjectDependencyResolve
	it('resolves', ()=> {
		const r = declarative(self=> ({
			a: 1,
			l1: {a: 2, b: 3},
			c: {a: 2, b: 3, ssum: self.s.sum, gsum: self.c.ssum, rsum: self.c.gsum},
			s: {sum: self.c.a + self.c.b},
			circular: (Number(self.circular) || 0) + (Number(self.l1.a)||2)-1,
		}), {n: 4})
		// log(r)
		expect(r).toEqual({
			a: 1,
			l1: { a: 2, b: 3 },
			c: { a: 2, b: 3, ssum: 5, gsum: 5, rsum: 5 },
			s: { sum: 5 },
			circular: 6,
		})
	})
	it('keeps ref', ()=> {
		const fn = self=> ({
			a: {b: 1},
			c: self.a,
		})
		const r = declarative(fn, {n: 1})
		// log(r)
		expect(r).toEqual({
			a: {b: 1},
			c: {b: 1},
		})
		expect(r.a).toBe(r.c)
	})
	it('keeps ref - circular', ()=> {
		const r = declarative(self=> ({
			a: {b: 1, c: self.a},
		}), {n: 2})
		// log(r)
		expect(r.a.b).toBe(1)
		expect(r.a.c).toBe(r.a)
	})

	it('keeps ref - outside', ()=> {
		const v = {k: 3}
		const r = declarative(()=> ({a: v, b: v}), {n: 0})
		// log(r)
		expect(r.a).toBe(r.b)
	})
	it('keeps ref - inside', ()=> {
		const r = declarative(()=> { const v = {k: 3}; return {a: v, b: v} }, {n: 0})

		// log(r)
		expect(r.a).toBe(r.b)
	})

	it('keeps ref - inside array', ()=> {
		// fixed: arrays are replaced, thereby not keeping the ref
		// 	solution: add arrayMergeAsObjectByIndex to deepAssign and set to true

		// const bodyGet = ({body})=> declarative(({b}, v = {k: 5})=> ({a: [b], b: v}), {n: 1})
		// const r = declarative(({body})=> ({z: /z/, body: bodyGet({})}), {n: 0})

		const body = ()=> declarative(({a}, v = {k: 5})=> ({a: v, b: [a]}), {n: 0})
		const r = declarative(()=> ({body: body()}), {n: 0})
		// log(r)
		expect(r.body.a).toBe(r.body.b[0])
	})
	
})


describe('objectMap', ()=> {
	it('objectMap', ()=> {
		expect(objectMap((v, k)=> `${k}: ${typeof v}`)({a: 5, b: {c: 3}})).toEqual({
			a: 'a: number',
			b: 'b: object',
		})
	})
	it('objectMapRecursive', ()=> {
		// TODO: test nested arrays
		expect(objectMapRecursive({a: 5, b: {c: 3}}, (v, k)=> `${k}: ${typeof v}`)).toEqual({
			a: 'a: number',
			b: 'b: object',
		})
		expect(objectMapRecursive({a: 5, b: {c: 3}},
			(v, k, {recurse})=> recurse? recurse(): `${k}: ${typeof v}`
		)).toEqual({
			a: 'a: number',
			b: {
				c: 'c: number',
			},
		})
	})
})

describe('expectDeepSubsetMatch', ()=> {
	it('does', ()=> {
		expectDeepSubsetMatch({}, {})
		expectDeepSubsetMatch({a: 3}, {})
		expect(()=> expectDeepSubsetMatch({}, {a: 3})).toThrow('Expected')
	})
	it('recursive', ()=> {
		const a = {z: 5, id: 'a'}; a.r = a
		const b = {z: 5}; b.r = b
		expectDeepSubsetMatch({a}, {a: b})
	})
})

describe('objectKeyDotNotationResolveShallow', ()=> {
	it('non-dot no change', ()=> {
		expect(objectKeyDotNotationResolveShallow({
			a: 5,
			b: {c: 'd'},
		})).toEqual({
			a: 5,
			b: {c: 'd'},
		})
	})
	it('resolves first level', ()=> {
		expect(objectKeyDotNotationResolveShallow({
			'a.b': 5,
		})).toEqual({
			a: {b: 5},
		})
	})
	it('shallow', ()=> {
		expect(objectKeyDotNotationResolveShallow({
			a: {'b.c': 5},
		})).toEqual({
			a: {'b.c': 5},
		})
	})
	it('extends when resolves', ()=> {
		expect(objectKeyDotNotationResolveShallow({
			a: {b: 1, c: 2},
			'a.c': 3,
		})).toEqual({
			a: {b: 1, c: 3},
		})
	})
	it('extends when not resolves', ()=> {
		expect(objectKeyDotNotationResolveShallow({
			'a.c': 3,
			'a.d': 5,
			a: {b: 1, c: 2},
		})).toEqual({
			a: {b: 1, c: 2, d: 5},
		})
	})
})
