'use strict'

const Sequelize = require('sequelize');
const config    = require('../config.json');

var modem     = require('./modem');
var sequelize = new Sequelize(config.db.database, config.db.user, config.db.pass, {
	host: config.db.ip,
	dialect: config.db.engine,
	timezone: '+07:00'
});

var inbox  = sequelize.import('./model/inbox.model');
var outbox = sequelize.import('./model/outbox.model');

modem.on('sms', function(sms) {
	return inbox.create({
		nomer: sms.nomer,
		pesan: sms.pesan,
		tglSMS: sms.tgl,
		tipe: 1,
		port: config.modem.port
	});
});

modem.on('sms:send', function (nomer, pesan) {
	return outbox.create({
		nomer: nomer,
		pesan: pesan,
		tipe: 1,
		port: config.modem.port
	});
})

modem.on('ussd', function (ussd) {
	return inbox.create({
		pesan: ussd,
		tipe: 2,
		port: config.modem.port
	});
});

modem.on('ussd:send', function (code) {
	return outbox.create({
		nomer: code,
		tipe: 2,
		port: config.modem.port
	});
});

sequelize.start = function () {
	return sequelize.sync();
}

module.exports = sequelize;
