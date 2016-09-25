'use strict'

const Express    = require('express');
const BodyParser = require('body-parser');
const CORS       = require('cors');
const Http       = require('http');
const Colors	 = require('colors');

const config = require('../config.json');

var modem = require('./modem');
var web   = Express();

web.use(BodyParser.json()); // support json encoded bodies
web.use(BodyParser.urlencoded({ extended: true })); // support encoded bodies
web.use(CORS()); // enable Cross-Origin Resource Sharing
web.Server = Http.Server(web);

// Web Route Start Here
web.post('/cmd', function(req, res) {
	let cmd = req.body.cmd;
	if (cmd) {
		modem.sendAT(cmd);
		modem.once('cmd', function (data) {
			res.end(data);
		});
	} else {
		res.json({ success: false, message: 'Error, data empty' });
	}
});

web.post('/ussd', function(req, res) {
	let code  = req.body.code;
	let reset = req.body.reset;
	if (reset == 'true') modem.cancelUSSD();
	if (code) {
		function postUSSD (ussd) {
			res.json({ success: true, message: ussd });
		}
		modem.sendUSSD(code).once('ussd', postUSSD);

		setTimeout(function () {
			res.json({ success: false, message: 'Timeout' });
			// For Memory Manage
			modem.removeListener('ussd', postUSSD);
		}, 10000);
	} else {
		res.json({ success: false, message: 'Error, data empty' });
	}
});

web.post('/sms', function(req, res) {
	let nomer = req.body.nomer;
	let pesan = req.body.pesan;
	if (nomer) {
		function postSMSSent() {
			res.json({ success: true, message: 'Sending' });
		}
		modem.sendSMS(nomer, pesan).once('sms:sent', postSMSSent);

		setTimeout(function () {
			res.json({ success: false, message: 'Timeout' });
			// For Memory Manage
			modem.removeListener('sms:sent', postSMSSent);
		}, 10000);
	} else {
		res.json({ success: false, message: 'Error, data empty' });
	}
});


web.start  = function () {
	return new Promise(function (resolve, reject) {
		Http.Server(web).listen(config.web.port, function () {
			console.log(('WEB: Listened on port ' + config.web.port).green);
			return resolve();
		}).once('error', function(error) {
			console.log('WEB: Listening port failed'.red)
			return reject(error);
		});
	});
}

module.exports = web;
