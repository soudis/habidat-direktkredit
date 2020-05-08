const Sequelize = require('sequelize')
const bcrypt = require('bcrypt');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'passwordHashed', {type:  Sequelize.STRING,	allowNull: false})
			.then(() => query.addColumn('user', 'lastLogin',  {type: Sequelize.DATE, allowNull: true }))
			.then(() => query.addColumn('user', 'loginCount',  {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }))
},
down: async (query) => {
	return query.dropColumn('user', 'passwordHashed')
		.then(() => query.dropColumn('user', 'lastLogin'))
		.then(() => query.dropColumn('user', 'loginCount'))
}
}