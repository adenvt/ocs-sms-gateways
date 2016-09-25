const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('outbox', {
		id: {
			type: Sequelize.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		nomer: {
			type: Sequelize.STRING,
			allowNull: true
		},
		pesan: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		tipe: {
			type: Sequelize.BOOLEAN,
			defaultValue: 1,
			comment: '1: SMS, 2: USSD'
		},
		port: {
			type: Sequelize.STRING,
		}
	},{
		underscored: true,
		tableName: 'ocs_outbox'
	});
}
