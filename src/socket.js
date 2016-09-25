'use strict'

const SocketIO = require('socket.io');
const Http	   = require('http');

var modem = require('./modem');
var web   = require('./web');
var io    = SocketIO(Http.Server(web));

io.on('connection', function (socket) {
	// Client To Server ( Modem )
	socket.on('cmd', function (data) {
		modem.sendAT(data);
	});

	socket.on('ussd', function (code, reset) {
		if (reset) modem.cancelUSSD();
		if (code) {
			modem.sendUSSD(code);
		}
	});

	socket.on('sms', function (nomer, pesan) {
		if (nomer) {
			modem.sendSMS(nomer, pesan);
		}
	});
});

modem.on('cmd', function (data) {
	io.emit('cmd', data);
});

modem.on('ussd', function (ussd) {
	io.emit('ussd', ussd);
});

modem.on('sms', function (sms) {
	io.emit('sms', sms);
});
