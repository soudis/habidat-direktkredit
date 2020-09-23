/* jshint esversion: 8 */
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = {
	up: (query) => {
		return query.createTable('admin', {
			id: {
				type: Sequelize.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			logon_id: {
				type: Sequelize.STRING,
				allowNull: false
			},
			ldap: {
				type: Sequelize.BOOLEAN,
				alowNull: true
			},
			email: {
				type: Sequelize.STRING,
				allowNull: true
			},
	       	passwordHashed: {
	       		type: Sequelize.STRING,
	       		allowNull: false
	       	},
	       	lastLogin: {
	       		type: Sequelize.DATE,
	       		allowNull: true
	       	},
	       	loginCount: {
	       		type: Sequelize.INTEGER,
	       		allowNull: false,
	       		defaultValue: 0
	       	},
	       	passwordResetToken: {
	       		type:  Sequelize.STRING,
	       		allowNull: true
	       	},
	       	passwordResetExpires: {
	       		type: Sequelize.DATE,
	       		allowNull: true
	       	},
			savedViews: {
				type:  Sequelize.TEXT,
				allowNull: true,
				defaultValue: '[]'
			},
			createdAt: {
				type: Sequelize.DATE,
        		allowNull: false
			},
			updatedAt: {
				type: Sequelize.DATE,
        		allowNull: false
			}
		})
		.then(() => query.sequelize.query("SELECT id, logon_id, ldap, savedViews, password, passwordHashed, email, loginCount, passwordResetExpires, passwordResetToken, lastLogin FROM user WHERE administrator = 1", { type: query.sequelize.QueryTypes.SELECT}))
		.then(adminUsers => {
			var admins = [];
			adminUsers.forEach(user => {
				if (user.password && user.password !== '') {
					var salt = bcrypt.genSaltSync(10);
					user.passwordHashed = bcrypt.hashSync(user.password, salt);
				}
				admins.push({
					id: user.id,
					logon_id: user.logon_id,
					ldap: user.ldap,
					email: user.email,
					loginCount: user.loginCount || 0,
					passwordResetToken: user.passwordResetToken,
					passwordResetExpires: user.passwordResetExpires,
					lastLogin: user.lastLogin,
					passwordHashed: user.passwordHashed,
					savedViews: user.savedViews,
					createdAt: new Date,
					updatedAt: new Date
				})
			});
			if (admins.length > 0) {
				return query.bulkInsert('admin', admins, {});
			} else {
				return;
			}

		});

	},
	down: async (query) => {
		return query.dropTable('admin');
	}
}