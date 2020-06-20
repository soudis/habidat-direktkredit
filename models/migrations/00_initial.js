const Sequelize = require('sequelize')

module.exports = {
	up: (query) => {
		return query.createTable('user', {
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
			administrator: {
				type: Sequelize.BOOLEAN,
				alowNull: true
			},
			ldap: {
				type: Sequelize.BOOLEAN,
				alowNull: true
			},    
			password: {
				type: Sequelize.STRING,
				allowNull: false
			},
			first_name: {
				type: Sequelize.STRING,
				allowNull: true
			},
			last_name: {
				type: Sequelize.STRING,
				allowNull: true
			},
			street: {
				type: Sequelize.STRING,
				allowNull: true
			},
			zip: {
				type: Sequelize.STRING,
				allowNull: true
			},
			place: {
				type: Sequelize.STRING,
				allowNull: true
			},
			country: {
				type: Sequelize.STRING,
				allowNull: true
			},
			telno: {
				type: Sequelize.STRING,
				allowNull: true
			},
			email: {
				type: Sequelize.STRING,
				allowNull: true
			},
			IBAN: {
				type: Sequelize.STRING,
				allowNull: true
			},
			BIC: {
				type: Sequelize.STRING,
				allowNull: true
			},
			relationship: {
				type: Sequelize.STRING,
				allowNull: true
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
		.then(() => query.createTable('contract', {
			id: {
				type: Sequelize.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			user_id: {
				type: Sequelize.INTEGER(11),
				allowNull: false,
				references: {
					model: 'user',
					key: 'id'
				}
			},      
			sign_date: {
				type: Sequelize.DATE,
				allowNull: true
			},
			termination_type : {
				type: Sequelize.STRING,
				allowNull: true
			},
			termination_date: {
				type: Sequelize.DATE,
				allowNull: true
			},
			termination_period: {
				type: Sequelize.DECIMAL,
				allowNull: true
			},
			termination_period_type: {
				type: Sequelize.STRING,
				allowNull: true
			},      
			amount: {
				type: Sequelize.DECIMAL,
				allowNull: true
			},
			interest_rate: {
				type: Sequelize.DECIMAL,
				allowNull: true
			},
			status: {
				type: Sequelize.STRING,
				allowNull: true
			},
			notes: {
				type: Sequelize.TEXT,
				allowNull: true
			},
			createdAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			},
			updatedAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			}	
		}))
		.then(() => query.createTable('transaction', {
			id: {
				type: Sequelize.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			contract_id: {
				type: Sequelize.INTEGER(11),
				allowNull: false,
				references: {
					model: 'contract',
					key: 'id'
				}
			},
			type: {
				type: Sequelize.TEXT,
				allowNull: false
			},
			transaction_date: {
				type: Sequelize.DATE,
				allowNull: false
			},
			amount: {
				type: Sequelize.DECIMAL,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			},
			updatedAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			}	
		}))
		.then(() => query.createTable('file', {
			id: {
				type: Sequelize.INTEGER(11),
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			filename: {
				type: Sequelize.STRING,
				allowNull: false
			},
			description: {
				type: Sequelize.STRING,
				allowNull: true
			},
			mime: {
				type: Sequelize.STRING,
				allowNull: false
			},
			path: {
				type: Sequelize.STRING,
				allowNull: false
			},
			ref_id:  {
				type: Sequelize.INTEGER(11),
				allowNull: true
			},
			ref_table:  {
				type: Sequelize.STRING,
				allowNull: false
			},
			createdAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			},
			updatedAt: {
				type: Sequelize.DATE,
        		allowNull: false				
			}	
		}))		
},
down: async (query) => {
	return query.dropTable('file')
		.then(() => query.dropTable('transaction'))
		.then(() => query.dropTable('contract'))
		.then(() => query.dropTable('user'));
}
}