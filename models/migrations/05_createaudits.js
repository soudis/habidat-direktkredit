const Sequelize = require('sequelize');

const changesDataType = Sequelize.TEXT;
const attributes = {
    id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	changes: {
		type: changesDataType,
		allowNull: true,
		defaultValue: null,
	},
	metadata: {
		type: Sequelize.JSON,
		allowNull: false,
		defaultValue: [],
	},
	action: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	timestamp: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW,
	},
	target_id: {
		type: Sequelize.INTEGER(11)
	},
	user_id: {
		type: Sequelize.INTEGER(11)
	}
};

module.exports = {
	up: (query) => {
		return query.createTable('userLogs', attributes)
			.then(() => query.createTable('contractLogs', attributes))
			.then(() => query.createTable('transactionLogs', attributes))
			.then(() => query.createTable('fileLogs', attributes));
	},
	down: async (query) => {
		return query.dropTable('userLogs')
			.then(() => query.dropTable('contractLogs'))
			.then(() => query.dropTable('transactionLogs'))
			.then(() => query.dropTable('fileLogs'));	}
}