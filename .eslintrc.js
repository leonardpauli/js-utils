// TODO: export generator in @leonardpauli/eslint-config and use that one instead?

const m = require('@leonardpauli/eslint-config/.eslintrc.js')

m.extends = ['eslint:recommended']
m.plugins = []
m.overrides = []
m.env.node = true
m.env.es6 = true
Object.assign(m.rules, {
	"no-bitwise": 0,
	"camelcase": 0,
	"vue/prop-name-casing": 0,
	"space-before-function-paren": 0,
	"no-extra-parens": 0,
	"func-names": 0,
	"arrow-parens": 0,
	"one-var-declaration-per-line": 0,
	"sort-vars": 0,
	"prefer-destructuring": 0,
	"complexity": 0,
	"dot-notation": 0,
	'no-unused-vars': ['error', {
		varsIgnorePattern: '_.*',
		argsIgnorePattern: '_.*',
		"args": "after-used",
	}],
})

m.parserOptions.ecmaVersion = 2018

// console.dir(m, {depth: 5})

module.exports = m
