/* jshint esversion: 8 */
const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('contract', 'interest_rate_type', {type:  Sequelize.STRING, allowNull: true, defaultValue: 'money'});
	},
	down: async (query) => {
		return query.dropColumn('contract', 'interest_rate_type');
	}
}