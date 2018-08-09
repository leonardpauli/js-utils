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
			const t = {a: 1, b: {z: 5}, x: 7}
			const s = {a: /regex/, c: /somec/}
			expect(()=> deepAssign(t, s, {replaceNonObject: false})).toThrow(/destructive replace non-object prevented/)
		})
	})
})
