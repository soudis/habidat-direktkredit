const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'savedViews', {type:  Sequelize.TEXT, allowNull: true, defaultValue: '[]'})
	},
	down: async (query) => {
		return query.dropColumn('user', 'savedViews')
	}
}