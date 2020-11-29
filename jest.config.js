const fs = require('fs')
const path = require('path')

const corePackages = fs.readdirSync(path.resolve(__dirname, 'packages'))

module.exports = {
	coverage: true,
	testEnvironment: 'node',
	expand: true,
	forceExit: true,
	roots: ['<rootDir>/packages', '<rootDir>/test'],
	coverageDirectory: './coverage',
	collectCoverageFrom: ['**/packages/*/src/**/*.js'],

	coveragePathIgnorePatterns: [
		'node_modules/(?!(@nuxt|nuxt))',
		'packages/webpack/src/config/plugins/vue',
		'packages/server/src/jsdom',
	],

	testPathIgnorePatterns: ['examples/.*'],

	// transform: {
	//   '^.+\\.js$': 'babel-jest'
	// },

	moduleFileExtensions: ['js', 'json'],

	moduleNameMapper: {
		[`@frontal/(${corePackages.join('|')})(/?.*)$`]: '<rootDir>/packages/$1/src/$2',
	},
}
