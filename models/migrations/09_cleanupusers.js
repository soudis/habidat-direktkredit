/* jshint esversion: 8 */
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = {
	up: (query) => {
		return query.sequelize.query("DELETE FROM user WHERE administrator = 1", { type: query.sequelize.QueryTypes.DELETE})
		.then(() => query.removeColumn('user', 'ldap'))
		.then(() => query.removeColumn('user', 'administrator'))
		.then(() => query.removeColumn('user', 'savedViews'))
	},
	down: async (query) => {
		throw "Cannot downgrade";
	}
}