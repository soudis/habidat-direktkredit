const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'passwordResetToken', {type:  Sequelize.STRING,	allowNull: true})
			.then(() => query.addColumn('user', 'passwordResetExpires',  {type: Sequelize.DATE, allowNull: true }));
	},
	down: async (query) => {
		return query.dropColumn('user', 'passwordResetToken')
			.then(() => query.dropColumn('user', 'passwordResetExpires'))
	}
}