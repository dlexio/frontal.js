'use strict'
/* globals __resourceQuery */

var stripAnsi = require('strip-ansi')

var socket = require('./socket')

var overlay = require('./overlay')

var _require = require('./utils/log'),
	log = _require.log,
	setLogLevel = _require.setLogLevel

var sendMessage = require('./utils/sendMessage')

var reloadApp = require('./utils/reloadApp')

var createSocketUrl = require('./utils/createSocketUrl')

var status = {
	isUnloading: false,
	currentHash: '',
}
var options = {
	hot: false,
	hotReload: true,
	liveReload: false,
	initial: true,
	useWarningOverlay: false,
	useErrorOverlay: false,
	useProgress: false,
}
var socketUrl = createSocketUrl(__resourceQuery)
self.addEventListener('beforeunload', function () {
	status.isUnloading = true
})

if (typeof window !== 'undefined') {
	var qs = window.location.search.toLowerCase()
	options.hotReload = qs.indexOf('hotreload=false') === -1
}

// Register a new emitter
// self.HmrEmitter =
var sent = false

var onSocketMessage = {
	hot: function hot() {
		options.hot = true
		log.info('[WDS] Hot Module Replacement enabled.')
	},
	liveReload: function liveReload() {
		options.liveReload = true
		log.info('[WDS] Live Reloading enabled.')
	},
	invalid: function invalid() {
		if (sent === false) {
			log.info('[WDS] App updated. Recompiling...') // fixes #1042. overlay doesn't clear if errors are fixed but warnings remain.

			if (options.useWarningOverlay || options.useErrorOverlay) {
				overlay.clear()
			}

			sendMessage('Invalid')
			sent = true
		}
	},
	hash: function hash(_hash) {
		status.currentHash = _hash
	},
	'still-ok': function stillOk() {
		log.info('[WDS] Nothing changed.')

		if (options.useWarningOverlay || options.useErrorOverlay) {
			overlay.clear()
		}

		sendMessage('StillOk')
	},
	'log-level': function logLevel(level) {
		var hotCtx = require.context('webpack/hot', false, /^\.\/log$/)

		if (hotCtx.keys().indexOf('./log') !== -1) {
			hotCtx('./log').setLogLevel(level)
		}

		setLogLevel(level)
	},
	overlay: function overlay(value) {
		if (typeof document !== 'undefined') {
			if (typeof value === 'boolean') {
				options.useWarningOverlay = false
				options.useErrorOverlay = value
			} else if (value) {
				options.useWarningOverlay = value.warnings
				options.useErrorOverlay = value.errors
			}
		}
	},
	progress: function progress(_progress) {
		if (typeof document !== 'undefined') {
			options.useProgress = _progress
		}
	},
	'progress-update': function progressUpdate(data) {
		if (options.useProgress) {
			log.info('[WDS] '.concat(data.percent, '% - ').concat(data.msg, '.'))
		}

		sendMessage('Progress', data)
	},
	ok: function ok() {
		sendMessage('Ok')

		if (options.useWarningOverlay || options.useErrorOverlay) {
			overlay.clear()
		}

		if (options.initial) {
			return (options.initial = false)
		} // eslint-disable-line no-return-assign

		reloadApp(options, status)
	},
	'page-changed': function contentChanged(page) {
		var changedPage = page.name
		var currentPage = window.location.pathname.replace('/', '')
		var cases = [changedPage, changedPage.replace('index.html', ''), changedPage.replace('/index.html', '')]

		if (cases.indexOf(currentPage) > -1) {
			self.location.reload()
		}
	},
	'content-changed': function contentChanged() {
		log.info('[WDS] Content base changed. Reloading...')
		self.location.reload()
	},
	warnings: function warnings(_warnings) {
		log.warn('[WDS] Warnings while compiling.')

		var strippedWarnings = _warnings.map(function (warning) {
			return stripAnsi(warning)
		})

		sendMessage('Warnings', strippedWarnings)

		for (var i = 0; i < strippedWarnings.length; i++) {
			log.warn(strippedWarnings[i])
		}

		if (options.useWarningOverlay) {
			overlay.showMessage(_warnings)
		}

		if (options.initial) {
			return (options.initial = false)
		} // eslint-disable-line no-return-assign

		reloadApp(options, status)
	},
	errors: function errors(_errors) {
		log.error('[WDS] Errors while compiling. Reload prevented.')

		var strippedErrors = _errors.map(function (error) {
			return stripAnsi(error)
		})

		sendMessage('Errors', strippedErrors)

		for (var i = 0; i < strippedErrors.length; i++) {
			log.error(strippedErrors[i])
		}

		if (options.useErrorOverlay) {
			overlay.showMessage(_errors)
		}

		options.initial = false
	},
	error: function error(_error) {
		log.error(_error)
	},
	close: function close() {
		log.error('[WDS] Disconnected!')
		sendMessage('Close')
	},
}

socket(socketUrl, onSocketMessage)
