const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'account_notification_type', {type:  Sequelize.STRING,	allowNull: true});
	},
	down: async (query) => {
		return query.dropColumn('user', 'account_notification_type');
	}
}