const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('transaction', 'payment_type', {type:  Sequelize.TEXT, allowNull: true})
	},
	down: async (query) => {
		return query.dropColumn('transaction', 'payment_type')
	}
}