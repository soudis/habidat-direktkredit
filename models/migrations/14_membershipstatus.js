const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'membership_status', {type:  Sequelize.STRING,	allowNull: true})
	},
	down: async (query) => {
		return query.dropColumn('user', 'membership_status')
	}
}