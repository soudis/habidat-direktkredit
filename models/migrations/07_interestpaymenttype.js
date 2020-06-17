const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('contract', 'interest_payment_type', {type:  Sequelize.TEXT, allowNull: true})
	},
	down: async (query) => {
		return query.dropColumn('transaction', 'interest_payment_type')
	}
}