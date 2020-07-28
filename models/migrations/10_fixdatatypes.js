/* jshint esversion: 8 */
const Sequelize = require('sequelize');

module.exports = {
	up: (query) => {
		return query.changeColumn('contract', 'sign_date', { type: Sequelize.DATEONLY,	allowNull: true	})
			.then(() => query.changeColumn('contract', 'termination_date', { type: Sequelize.DATEONLY,	allowNull: true	}))
			.then(() => query.changeColumn('contract', 'amount', { type: Sequelize.DECIMAL(14,2),	allowNull: true	}))
			.then(() => query.changeColumn('contract', 'interest_rate', { type: Sequelize.DECIMAL(10,3), allowNull: true	}))
			.then(() => query.changeColumn('transaction', 'transaction_date', { type: Sequelize.DATEONLY,	allowNull: true	}))
			.then(() => query.changeColumn('transaction', 'amount', { type: Sequelize.DECIMAL(14,2), allowNull: true	}));
	},
	down: async (query) => {
		throw "Cannot downgrade";
	}
}