/* jshint esversion: 8 */
const moment = require('moment');
const Op = require("sequelize").Op;
const clonedeep = require('lodash.clonedeep');
const settings = require('../utils/settings');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const utils = require('../utils');
const format = require('../utils/format');
const intl = require('../utils/intl');

module.exports = (sequelize, DataTypes) => {
	var User = sequelize.define('user', {
		id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		logon_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		administrator: {
			type: DataTypes.BOOLEAN,
			alowNull: true
		},
		ldap: {
			type: DataTypes.BOOLEAN,
			alowNull: true
		},
		password: {
			type: DataTypes.STRING,
			allowNull: true
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		street: {
			type: DataTypes.STRING,
			allowNull: true
		},
		zip: {
			type: DataTypes.STRING,
			allowNull: true
		},
		place: {
			type: DataTypes.STRING,
			allowNull: true
		},
		country: {
			type: DataTypes.STRING,
			allowNull: true
		},
		telno: {
			type: DataTypes.STRING,
			allowNull: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true
		},
		IBAN: {
			type: DataTypes.STRING,
			allowNull: true
		},
		BIC: {
			type: DataTypes.STRING,
			allowNull: true
		},
		relationship: {
			type: DataTypes.STRING,
			allowNull: true
		},
       	passwordHashed: {
       		type: DataTypes.STRING,
       		allowNull: false
       	},
       	lastLogin: {
       		type: DataTypes.DATE,
       		allowNull: true
       	},
       	loginCount: {
       		type: DataTypes.INTEGER,
       		allowNull: false,
       		defaultValue: 0
       	},
       	passwordResetToken: {
       		type:  DataTypes.STRING,
       		allowNull: true
       	},
       	passwordResetExpires: {
       		type: DataTypes.DATE,
       		allowNull: true
       	},
		savedViews: {
			type:  DataTypes.TEXT,
			allowNull: true,
			defaultValue: '[]'
		}
	}, {
		tableName: 'user',
		freezeTableName: true
	});

	User.beforeCreate(user => {
		if (!user.administrator) {
			user.logon_id = Math.abs(Math.random() * 100000000);
		}
	});

	User.afterCreate(user => {
		if (!user.administrator) {
			var id = user.id + 10000;
			return user.update({
				logon_id: id + '_' + settings.project.get('usersuffix')
			}, {
				where: {
					id: user.id
				},
				trackOptions: utils.getTrackOptions(user, false)
			});
		}
	});

	User.beforeValidate(user => {
		if (user.password && user.password !== '') {
			var salt = bcrypt.genSaltSync(10);
			user.passwordHashed = bcrypt.hashSync(user.password, salt);
			user.password = '';
		}
	});

	User.associate = function (db) {
		db.user.hasMany(db.contract, {
			foreignKey: 'user_id'}
			);

		db.user.hasMany(db.file, {
			foreignKey: 'ref_id',
			scope: {
				ref_table: 'user'
			}
		});
	};

	User.findByIdFetchFull = function (models, id) {
		return models.user.findOne({
			where: {
				id: id
			},
			include:[{
				model: models.contract,
				as: 'contracts',
				include : {
					model: models.transaction,
					as: 'transactions'
				}},{
					model: models.file,
					as: 'files',
				}
				],
				order:[[{
					model: models.contract,
					as: 'contracts'},
					'sign_date'],[{
						model: models.contract,
						as: 'contracts'
					},{
						model: models.transaction,
						as: 'transactions'
					},
					'transaction_date']]
				});
	};

	User.findFetchFull = function (models, whereClause, contractFilter = undefined) {
		return models.user.findAll({
			where: whereClause,
			include:{
				model: models.contract,
				as: 'contracts',
				include : {
					model: models.transaction,
					as: 'transactions'
				}
			},
			order:[['last_name'], ['first_name'],[{
				model: models.contract,
				as: 'contracts'},
				'sign_date'],[{
					model: models.contract,
					as: 'contracts'
				},{
					model: models.transaction,
					as: 'transactions'
				},
				'transaction_date']]
			})
			.then(users => {
				if (contractFilter) {
					users.forEach(function(user){
						var contracts = [];
						user.contracts.forEach(function(contract){
							if (contractFilter(user, contract)) {
								contracts.push(contract);
							}
						});
						user.contracts = contracts;
					});
					return users.filter(user => { return user.contracts.length > 0; });
				} else {
					return users;
				}
			});
	};

	User.getUsers = function (models, mode, date) {
		var activeUsers = [];
		return models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
		.then(users => {
			users.forEach(function(user){
				if(mode == 'all' || user.hasNotTerminatedContracts(date)) {
					activeUsers.push(user);
				}
			});
			return activeUsers;
		});
	};

	User.cancelledAndNotRepaid = function (models, whereClause) {
		return models.user.findFetchFull(models, whereClause)
		.then(users => {
			var usersCancelled = [];
			var now = moment();
			users.forEach(function(user){
				var contracts = [];
				user.contracts.forEach(function(contract){
					if (contract.isCancelledAndNotRepaid(now)) {
						contracts.push(contract);
					}
				});
				user.contracts = contracts;
			});
			return users.filter(user => { return user.contracts.length > 0; });
		});
	};

	User.findByToken = function (token) {
		return User.findOne({where: { passwordResetToken: token }})
			.then(user => {
				console.log('now: ' + moment() + ', expires: ' + moment(user.passwordResetExpires));
				if (!user || moment().isAfter(moment(user.passwordResetExpires))) {
					throw 'Der Link ist abgelaufen, bitte versuche es noch einmal';
				} else {
					return user;
				}
			});
	};

	User.emailAddressTaken = function (email) {
		return User.count({where: { email: email }})
			.then(count => {
				return count !== 0;
			});
	};


	User.getColumns = function () {
		return {
			user_id: {id: "user_id",  label: "Kontonummer", filter: 'text'},
			user_first_name: {id: "user_first_name",  label: "Vorname", filter: 'text'},
			user_last_name: {id: "user_last_name",  label: "Nachname", filter: 'text'},
			user_name: {id: "user_name",  label: "Name", priority: "2", filter: 'text'},
			user_address: {id: "user_address",  label: "Adresse", filter: 'text'},
			user_address_oneline: {id: "user_address_oneline",  label: "Adresse (einzeilig)", filter: 'text'},
			user_telno: {id: "user_telno",  label:"Telefon", filter: 'text'},
			user_email: {id: "user_email",  label:"E-Mail", filter: 'text'},
			user_iban: {id: "user_iban",  label:"IBAN", filter: 'text'},
			user_bic: {id: "user_bic",  label: "BIC", filter: 'text'},
			user_relationship: {id: "user_relationship",  label:"Beziehung", filter: 'list'},
			user_street: {id: "user_street",  label: "Strasse", filter: 'text'},
			user_zip: {id: "user_zip",  label: "PLZ", filter: 'text'},
			user_place: {id: "user_place",  label: "Ort", filter: 'text'},
			user_country: {id: "user_country",  label: "Land", filter: 'text'},
			user_logon_id: {id: "user_logon_id",  label: "Anmeldename", filter: 'text'}
		}
	}

	const umlautMap = {
		'\u00dc': 'UE',
		'\u00c4': 'AE',
		'\u00d6': 'OE',
		'\u00fc': 'ue',
		'\u00e4': 'ae',
		'\u00f6': 'oe',
		'\u00df': 'ss',
	};

	var replaceUmlaute = function (str) {
		return str
		.replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
			const big = umlautMap[a.slice(0, 1)];
			return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
		})
		.replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
			(a) => umlautMap[a]
			);
	};

	User.prototype.getRow = function () {
		var user = this;
		return {
			user_id: { valueRaw: user.id, value:  user.id  },
			user_first_name: { valueRaw: user.first_name, value:  user.first_name  },
			user_last_name: { valueRaw: user.last_name, value:  user.last_name  },
			user_name: { valueRaw: user.getFullName(), value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
			user_address: { valueRaw: user.getAddress(true), value: user.getAddress(true) },
			user_address_oneline: { valueRaw: user.getAddress(false), value: user.getAddress(true) },
			user_telno: { valueRaw: user.telno, value: user.telno },
			user_email: { valueRaw: user.email, value: user.email },
			user_iban: { valueRaw: user.IBAN, value: user.IBAN },
			user_bic: { valueRaw: user.BIC, value: user.BIC },
			user_relationship: { valueRaw: user.relationship, value: user.relationship },
			user_street: { valueRaw: user.street, value: user.street },
			user_zip: { valueRaw: user.zip, value: user.zip },
			user_place: { valueRaw: user.place, value: user.place },
			user_country: { valueRaw: user.country, value: user.country },
			user_logon_id: { valueRaw: user.logon_id, value: user.logon_id }
		}
	}

	User.prototype.getAddress = function (lineBreak=false) {
		var address = "";
		if (this.street) {
			address += this.street;
			if (lineBreak) {
				address += "</br>";
			} else {
				address+= ", ";
			}
		}
		if (this.country) {
			address += this.country;
			if (this.zip) {
				address += "-";
			}
		}
		if (this.zip) {
			address += this.zip;
		}
		if (this.place) {
			if (address != "") {
				address += " ";
			}
			address += this.place;
		}
		return address;
	};

	User.prototype.getOldestContract = function () {
		var oldest;
		this.contracts.forEach(contract => {
			if (!oldest || moment(oldest.sign_date).isAfter(contract.sign_date)) {
				oldest = contract;
			}
		})
		return oldest;;
	};


	User.prototype.getFullName = function () {
		var name = this.first_name;
		if (this.last_name) {
			name = this.last_name.toUpperCase() + " " + name;
		}
		return name;
	};

	User.prototype.getLink = function () {
		return `<a href="/user/show/${this.id}">${this.getFullName()}</a>`
	}

	User.prototype.getDescriptor = function (models) {
		return `Stammdaten von ${this.getLink()}`
	};

	User.prototype.comparePassword = function comparePassword(candidatePassword, cb) {
		return bcrypt.compareSync(candidatePassword, this.passwordHashed);
	};

	User.prototype.setPasswordResetToken = function() {
		this.passwordResetToken = crypto.randomBytes(16).toString('hex');
		this.passwordResetExpires = Date.now() + 3600000 * 3; // 3 hours
	}

	User.prototype.hasNotTerminatedContracts = function (date) {
		var notTerminated = false;
		this.contracts.forEach(function(contract) {
			if (!(contract.termination_date && moment(contract.termination_date).diff(date) <=0)) {
				notTerminated = true;
			}
		});
		return notTerminated;
	};


	User.prototype.isActive = function () {
		var active;
		this.contracts.forEach(function(contract){
			if (!contract.isTerminated()) {
				active = true;
			}
		});
		return active;
	};

	User.prototype.isAdmin = function () {
		if (this.administrator) {
			return true;
		}
	};

	User.prototype.getTransactionList = function (year) {
		var transactionList = [];
		var user = this;
		var firstDay = moment(year + " +00:00", "YYYY Z");
		var firstDayNextYear = moment(year + " +00:00", "YYYY Z").add(1, "years");
		this.contracts.forEach(function(contract) {
			var sums = {
				begin : {
					amount: 0,
					interest:0
				},
				end : {
					amount: 0,
					interest: 0},
					transactions : 0
			};
			var lastTransaction;
			if (contract.isTerminated(firstDay) === false) {
				contract.transactions.forEach(function(transaction) {
					if (firstDay.diff(transaction.transaction_date) >= 0) {
						sums.begin.amount += transaction.amount;
						sums.begin.interest += + transaction.interestToDate(contract.interest_rate, firstDay);
						sums.end.amount += transaction.amount;
						sums.end.interest += + transaction.interestToDate(contract.interest_rate, firstDayNextYear);
					} else  if ( firstDay.diff(transaction.transaction_date) < 0 && firstDayNextYear.diff(transaction.transaction_date) >= 0) {
						var trans =  {
							id : user.id,
							last_name: user.last_name,
							first_name: user.first_name,
							contract_id: contract.id,
							interest_rate: contract.interest_rate,
							date: moment(transaction.transaction_date),
							type: transaction.getTypeText(),
							amount: transaction.amount,
							interest: ""
						};
						transactionList.push(trans);
						sums.transactions++;
						lastTransaction = transaction.transaction_date;
						sums.end.amount += transaction.amount;
						sums.end.interest += + transaction.interestToDate(contract.interest_rate, firstDayNextYear);

					}
				});
				sums.begin.interest = Math.ceil(sums.begin.interest*100) / 100;
				sums.end.interest = Math.ceil(sums.end.interest*100) / 100;
				if (contract.isTerminated(firstDayNextYear)) {
					sums.end.interest = -sums.end.amount;
					sums.end.amount = 0;
				} else if (sums.end.amount >0 || sums.end.interest >0){
					var endBalance = {
						id : user.id,
						last_name: user.last_name,
						first_name: user.first_name,
						contract_id: contract.id,
						interest_rate: contract.interest_rate,
						date: firstDayNextYear,
						type: 'Kontostand Jahresende',
						amount: sums.end.amount + sums.end.interest,
						interest: sums.end.interest
					};
					transactionList.push(endBalance);
				}
				if (sums.begin.amount > 0 || sums.begin.interest > 0) {
					var beginBalance = {
						id : user.id,
						last_name: user.last_name,
						first_name: user.first_name,
						contract_id: contract.id,
						interest_rate: contract.interest_rate,
						date: firstDay,
						type: 'Kontostand Jahresbeginn',
						amount: sums.begin.amount + sums.begin.interest,
						interest: sums.begin.interest
					};
					transactionList.push(beginBalance);
				}

				var interest = {
					id : user.id,
					last_name: user.last_name,
					first_name: user.first_name,
					contract_id: contract.id,
					interest_rate: contract.interest_rate,
					date: (contract.isTerminated(firstDayNextYear)&&lastTransaction?moment(lastTransaction):moment(firstDayNextYear).subtract(1, 'days')),
					type: 'Zinsertrag ' + year,
					amount: Math.round((sums.end.interest - sums.begin.interest) * 100)/100,
					interest: ""
				};
				transactionList.push(interest);
			}
		});
		return transactionList;
	};

	return User;
};
