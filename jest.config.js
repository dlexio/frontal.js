const fs = require('fs')
const path = require('path')

const corePackages = fs.readdirSync(path.resolve(__dirname, 'packages'))

module.exports = {
	testEnvironment: 'node',
	expand: true,
	forceExit: true,
	roots: ['<rootDir>/packages', '<rootDir>/test'],
	coverageDirectory: './coverage',
	collectCoverageFrom: ['**/packages/*/src/**/*.js'],
	coveragePathIgnorePatterns: [],
	testPathIgnorePatterns: ['examples/.*'],
	moduleFileExtensions: ['js', 'json'],
	moduleNameMapper: {
		[`@frontal/(${corePackages.join('|')})(/?.*)$`]: '<rootDir>/packages/$1/src/$2',
	},
}
