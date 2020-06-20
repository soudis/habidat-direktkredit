const Sequelize = require('sequelize')
const bcrypt = require('bcrypt');

module.exports = {
	up: (query) => {
		return query.changeColumn('user', 'password', {type:  Sequelize.STRING, allowNull: true});
	},
	down: async (query) => {
		return query.changeColumn('user', 'password', {type:  Sequelize.STRING, allowNull: false});
	}
}