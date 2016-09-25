'use strict'

const Colors = require('colors');
const config = require('./config.json');

var modem = require('./src/modem');
var web   = require('./src/web');
var io    = require('./src/socket');
var db    = require('./src/db');

modem.start().then(web.start).then(db.start).then(function () {
	console.log('SYSTEM: All Green'.green);
}).catch(function (error) {
	console.log('SYSTEM: Failed to Start'.red);
	console.log(('ER: '+ error).red);
	process.exit();
});

