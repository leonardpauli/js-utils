// utils/object-deepAssign.test.js
// LeonardPauli/js-utils
//
// created by Leonard Pauli, aug 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import deepAssign from './object-deepAssign'


describe('deepAssign', ()=> {
	// it('assigns', ()=> {
	// })
	// it('keeps ref', ()=> {
	// })
	it('keeps ref - circular', ()=> {
		const ra = {b: 1}
		const r = {a: ra}
		const o = {a: {b: 2}}; o.a.c = o.a
		deepAssign(r, o)
		// log(r)
		expect(r.a.b).toBe(2)
		expect(r.a).toBe(ra)
	})

	it('keeps ref - entangle + extend (don\'t skip as circular)', ()=> {
		const v = {k: 4}
		const w = {k: 5}
		const o = {a: v, b: v}
		const r = {a: w, b: w}

		deepAssign(o, r)
		// log({o})
		expect(o.a).toBe(o.b)
	})

	describe('replaceEmpty', ()=> {
		const t = {a: 1}
		const s = /regex/
		
		it('default prevent top level replace', ()=>
			expect(()=> deepAssign(t, s)).toThrow(/destructive merge prevented/))

		it('top level: replaceEmpty: true; leaves target unchanged + returns replaced', ()=> {
			const r = deepAssign(t, s, {replaceEmpty: true})
			expect(t).toEqual({a: 1}) // unchanged
			expect(r).toBe(s) // replaced
		})

		it('child level', ()=> {
			const t = {a: 1, b: {z: 5}, x: 7}
			const s = {a: /regex/, b: /someb/, c: /somec/}
			const r = deepAssign(t, s)

			expect(r).toBe(t)
			expect(t.a).toBe(s.a)
			expect(t.b).toBe(s.b)
			expect(t.c).toBe(s.c)
			expect(t.x).toBe(7)
		})

		it('child level - not replaceNonEmptyAllowed', ()=> {
			const t = {a: 1, b: {z: 5}, x: 7}
			const s = {a: /regex/, b: /someb/, c: /somec/}
			expect(()=> deepAssign(t, s, {replaceNonEmptyAllowed: false})).toThrow(/destructive merge prevented/)
		})

		it('child level - not replaceEmpty', ()=> {
			const t = {a: 1, b: {z: 5}, x: 7}
			const s = {a: /regex/, c: /somec/}
			expect(()=> deepAssign(t, s, {replaceEmpty: false})).not.toThrow()

			const r = deepAssign(t, s, {replaceNonEmptyAllowed: true})
			expect(r).toBe(t)
			expect(t.a).toBe(s.a)
			expect(t.c).toBe(s.c)
			expect(t.x).toBe(7)
		})

		it('child level - not replaceNonObject', ()=> {
			const t = {a: 1} // , b: {z: 5}, x: 7
			const s = {a: /regex/} // , c: /somec/
			expect(()=> deepAssign(t, s, {replaceNonObject: false})).toThrow(/destructive replace non-object prevented/)
		})

		it('child level - replace empty with non plain (with not replaceNonEmptyAllowed)', ()=> {
			const t = {a: {}}
			const s = {a: 'hello'}
			const r = deepAssign(t, s, {replaceNonEmptyAllowed: false})

			expect(r).toBe(t)
			expect(t.a).toBe('hello')
		})
	})

	describe('arrays', ()=> {
		it('appends items', ()=> {
			const t = {a: [1, 2]}
			const s = {a: [3, 4]}
			const r = deepAssign(t, s, {mergeInsteadOfReplace: true})

			expect(r).toBe(t)
			expect([...t.a]).toEqual([1, 2, 3, 4])
		})

		it('casts', ()=> {
			const t = {a: {z: 7}}
			const s = {a: [3, 4]}
			const r = deepAssign(t, s, {mergeInsteadOfReplace: true})

			expect(r).toBe(t)
			expect([...t.a]).toEqual([3, 4])
			expect(t.a.z).toBe(7)
		})

		it('extends', ()=> {
			const arr = [1, 2]
			arr.z = 7
			const arr2 = [3, 4]
			arr2.y = 8
			const t = {a: arr}
			const s = {a: arr2}
			const r = deepAssign(t, s, {mergeInsteadOfReplace: true})

			expect(r).toBe(t)
			expect([...t.a]).toEqual([1, 2, 3, 4])
			expect(t.a.z).toBe(7)
			expect(t.a.y).toBe(8)
		})

		it('replaces', ()=> {
			const arr = [1, 2]
			arr.z = 7
			const arr2 = [3, 4]
			arr2.y = 8
			const t = {a: arr}
			const s = {a: arr2}
			const r = deepAssign(t, s)

			expect(r).toBe(t)
			expect(t.a).toBe(arr2)
		})

		it('arrayMergeAsObjectByIndex', ()=> {
			const arr = [1, 2]
			arr.z = 7
			const arr2 = [3, 4]
			arr2.y = 8
			const arr3 = [3, 4]
			arr3.z = 7; arr3.y = 8

			const t = {a: arr}
			const s = {a: arr2}
			const r = deepAssign(t, s, {arrayMergeAsObjectByIndex: true})

			expect(r).toBe(t)
			expect(t.a).toBe(arr)
			expect(arr).toEqual(arr3)
		})
		it('arrayMergeAsObjectByIndex - circular', ()=> {
			const k = {kk: 5}; k.r = k
			const z = {kk: 6}; z.r = z

			// const t = {b: [k]} // a: k,
			// const s = {b: [z]} // a: z,
			const t = {a: k, b: [k]}
			const s = {a: z, b: [z]}

			const r = deepAssign(t, s, {arrayMergeAsObjectByIndex: true})
			// log(r)
			expect(r.b[0]).toBe(k)
			expect(r.b[0].r).toBe(k)
			expect(k.kk).toBe(z.kk)
		})
	})

	it('replaces empty', ()=> {
		const v = {k: 5}
		const t = {a: {}, b: {}}
		const s = {a: v, b: v}
		const r = deepAssign(t, s)

		expect(t.a).toBe(v)
		expect(t.a).toBe(t.b)
	})
})
