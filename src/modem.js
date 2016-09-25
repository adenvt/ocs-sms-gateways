'use strict'

const SerialPort = require('serialport');
const XRegExp    = require('xregexp');
const Colors     = require('colors');
const config     = require('../config.json');

var modem = new SerialPort(config.modem.port, {
	baudRate: config.modem.baudRate,
	parser: SerialPort.parsers.readline('\r'),
	autoOpen: false
});

modem.sendAT = function(cmd) {
	modem.write(cmd);
	modem.write('\r');
	console.log(('TX: ' + cmd.trim()).gray);
	return modem;
}

modem.sendSMS = function(tujuan, pesan) {
	modem.sendAT('AT+CMGF=1');
	modem.sendAT('AT+CMGS="'+ tujuan +'"');
	modem.write(pesan);
	modem.write(Buffer([0x1A])); // [Ctrl + Z]
	modem.emit('sms:send', tujuan, pesan);
	return modem;
}

modem.sendUSSD = function(code) {
	modem.emit('ussd:send', code);
	return modem.sendAT('AT+CUSD=1,"'+ code +'",15');
}

modem.cancelUSSD = function() {
	return modem.sendAT('AT+CUSD=2');
}

modem.sms = {
	buffer: false,
	raw: '',
}

modem.on('error', function (error) {
	console.log(('ER: ' + error.message).red);
});

modem.on('data', function (rx) {
	const data = rx.trim();
	if (data) {
		console.log(('RX: ' + data).cyan);
		modem.emit('cmd', data);

		// SMS Buffer
		if (modem.sms.buffer) {
			modem.sms.raw    += ',"';
			modem.sms.raw    += Buffer(data).toString('base64');
			modem.sms.raw    += '"';
			modem.sms.buffer  = false;
			if ( ! (/^your message/.test(data))) {
				let check = XRegExp('\\+CMT:.*"(\\+?\\d+)".*"([\\d+\\/,: ]+)".*"(.*)"');
				let hasil = XRegExp.exec(modem.sms.raw, check);
				if (hasil) {
					let sms = {
						nomer: hasil[1],
						pesan: Buffer(hasil[3], 'base64').toString('ascii'),
						tgl: hasil[2].replace(/(\d+)\/(\d+)\/(\d+),(\d+)\s?:(\d+)\s?:(\d+).*/,'20$1-$2-$3 $4:$5:$6'),
					}
					return modem.emit('sms', sms);
				}
			}
		}

		// Check if SMS
		if (/\+CMT\:/.test(data)) {
			modem.sms.buffer = true;
			modem.sms.raw    = data;
			return data;
		}

		// Check if USSD
		if (/\+CUSD\:/.test(data)) {
			let check = XRegExp('\\+CUSD: [0-2],"(.*)",15','s');
			let hasil = XRegExp.exec(data, check);
			if (hasil) {
				return modem.emit('ussd', hasil[1]);
			}
		}

		if (/\+CMGS\:/.test(data)) {
			let check = XRegExp('\\+CUSD: (\\d+)');
			let hasil = XRegExp.exec(data, check);
			if (hasil) {
				return modem.emit('sms:sent', hasil[1]);
			}
		}
	}
});

modem.start = function () {
	return new Promise(function (resolve, reject) {
		modem.open(function (error) {
			if (error) {
				return reject(error.message);
			}
			console.log('MODEM: Connected on port ' + config.modem.port);

			console.log('MODEM: Configuring...');
			modem.sendAT('ATE0');
			modem.sendAT('AT+CMGF=1');
			modem.sendAT('AT+CNMI=2,2,2,0,0');

			var counter = 0;
			function checkConfiguring (data) {
				if (data == 'OK') {
					++counter;
					if (counter == 3) {
						console.log('MODEM: Configuring success'.green);
						modem.removeListener('cmd', checkConfiguring);
						return resolve();
					}
				} else {
					console.log('MODEM: Configuring failed'.red);
					modem.removeListener('cmd', checkConfiguring);
					return reject('Config #'+ (counter+1) + ' not reply `OK`');
				}
			}
			modem.on('cmd', checkConfiguring);
		});
	});
}

module.exports = modem;
