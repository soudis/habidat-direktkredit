/* jshint esversion: 8 */
const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('file', 'public', {type:  Sequelize.BOOLEAN, allowNull: true, defaultValue: false});
	},
	down: async (query) => {
		return query.dropColumn('file', 'public');
	}
}