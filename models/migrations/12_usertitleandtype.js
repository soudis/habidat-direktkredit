const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.addColumn('user', 'title_prefix', {type:  Sequelize.STRING,	allowNull: true})
			.then(() => query.addColumn('user', 'title_suffix',  {type: Sequelize.STRING, allowNull: true }))
			.then(() => query.addColumn('user', 'type',  {type: Sequelize.STRING, allowNull: true }));
	},
	down: async (query) => {
		return query.dropColumn('user', 'title_prefix')
			.then(() => query.dropColumn('user', 'title_suffix'))
			.then(() => query.dropColumn('user', 'type'))
	}
}