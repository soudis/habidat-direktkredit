/* jshint esversion: 8 */
const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('contract', 'notes_public', {type:  Sequelize.BOOLEAN, allowNull: true, defaultValue: false});
	},
	down: async (query) => {
		return query.dropColumn('contract', 'notes_public');
	}
}