/* jshint esversion: 8 */

const moment = require('moment');
const format = require('../utils/format');
const settings = require('../utils/settings');
const _t = require('../utils/intl')._t;
const intl = require('../utils/intl');

module.exports = (sequelize, DataTypes) => {
	contract = sequelize.define('contract', {
			id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			user_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'user',
					key: 'id'
				}
			},
			sign_date: {
				type: DataTypes.DATE,
				allowNull: true
			},
			interest_payment_type: {
				type: DataTypes.STRING,
				allowNull: true
			},
			termination_type : {
				type: DataTypes.STRING,
				allowNull: true
			},
			termination_date: {
				type: DataTypes.DATE,
				allowNull: true
			},
			termination_period: {
				type: DataTypes.DECIMAL,
				allowNull: true
			},
			termination_period_type: {
				type: DataTypes.STRING,
				allowNull: true
			},
			amount: {
				type: DataTypes.DECIMAL,
				allowNull: true
			},
			interest_rate: {
				type: DataTypes.DECIMAL,
				allowNull: true
			},
			status: {
				type: DataTypes.STRING,
				allowNull: true
			},
			notes: {
				type: DataTypes.TEXT,
				allowNull: true
			}
		}, {
			tableName: 'contract',
			freezeTableName: true
		}
	);

	contract.associate = function (db) {
		db.contract.hasMany(db.transaction, {
			targetKey: 'id',
			foreignKey: 'contract_id'
		});
		db.contract.belongsTo(db.user, {
			onDelete: "CASCADE",
			foreignKey: 'user_id'
		});
	};

	contract.findByIdFetchFull = function (models, id) {
		return models.contract.findOne({ where : { id: id }, include: [{model: models.transaction, as: "transactions"}]});
	};

	contract.getColumns = function (interestYear) {
		return {
			contract_sign_date: {id: "contract_sign_date", label: "Vertragsdatum", priority: "2", filter: 'date'},
			contract_id: {id: "contract_id",  label:"Vertragsnummer", filter: 'text'},
			contract_amount: {id: "contract_amount",  label: "Vertragswert", class: "text-right", filter: 'number'},
			contract_interest_rate: {id: "contract_interest_rate",  label: "Zinssatz", class: "text-right", filter: 'number'},
			contract_deposit: {id: "contract_deposit",  label: "Einzahlungen", class: "text-right", filter: 'number'},
			contract_withdrawal: {id: "contract_withdrawal",  label: "Auszahlungen", class: "text-right", filter: 'number'},
			contract_amount_to_date: {id: "contract_amount_to_date",  label: "Aushaftend", class: "text-right", filter: 'number'},
			contract_interest_to_date: {id: "contract_interest_to_date",  label: "Zinsen", class: "text-right", filter: 'number'},
			contract_interest_of_year: {id: "contract_interest_of_year",  label: "Zinsen " + interestYear, class: "text-right", filter: 'number'},
			contract_interest_payment_type: {id: "contract_interest_payment_type",  label: "Zinsauszahlung", class: "text-right", filter: 'number'},
			contract_termination_type: {id: "contract_termination_type",  label: "Kündigungsart", filter: 'list'},
			contract_termination_date: {id: "contract_termination_date",  label: "Kündigungsdatum", filter: 'date'},
			contract_payback_date: {id: "contract_payback_date",  label: "Rückzahlungsdatum", filter: 'date'},
			contract_status: {id: "contract_status",  label: "Status", class: "text-center", priority: "2", filter: 'list'},
			contract_has_interest: {id: "contract_has_interest",  label: "Zinssatz > 0", class: "text-center", priority: "2", filter: 'list'}
		}
	}


	contract.prototype.getRow = function (effectiveDate = undefined, interestYear = undefined) {
		var contract = this;
		var interestToDate = Math.round(contract.getInterestToDate(moment(effectiveDate))*100)/100;
		var amountToDate = Math.round(contract.getAmountToDate(moment(effectiveDate))*100)/100;
		var interestOfYear = Math.round(contract.getInterestOfYear(interestYear || moment().subtract(1,'years').year())*100)/100;
		return {
			contract_sign_date: { valueRaw: contract.sign_date, value: moment(contract.sign_date).format('DD.MM.YYYY'), order: moment(contract.sign_date).format('YYYY/MM/DD') },
			contract_id: { valueRaw: contract.id, value: contract.id },
			contract_amount: { valueRaw: contract.amount, value: format.formatMoney(contract.amount,2), order: contract.amount},
			contract_interest_rate: { valueRaw: contract.interest_rate, value: format.formatPercent(contract.interest_rate,2), order: contract.interest_rate},
			contract_deposit: { valueRaw: contract.getDepositAmount(), value: format.formatMoney(contract.getDepositAmount(), 2), order: contract.getDepositAmount(), class: contract.getDepositAmount()>0?"text-success":""},
			contract_withdrawal: { valueRaw: contract.getWithdrawalAmount(), value: format.formatMoney(contract.getWithdrawalAmount(), 2), order: contract.getWithdrawalAmount(), class: contract.getWithdrawalAmount()<0?"text-danger":"" },
			contract_amount_to_date: { valueRaw: amountToDate, value: format.formatMoney(amountToDate), order: amountToDate },
			contract_interest_to_date: { valueRaw: interestToDate, value: format.formatMoney(interestToDate), order: interestToDate },
			contract_interest_of_year: { valueRaw: interestOfYear, value: format.formatMoney(interestOfYear), order: interestOfYear },
			contract_interest_payment_type: { valueRaw: intl._t('interest_payment_type_'+contract.getInterestPaymentType()), value: intl._t('interest_payment_type_'+contract.getInterestPaymentType())},
			contract_termination_type: { valueRaw: contract.getTerminationTypeFullString(), value: contract.getTerminationTypeFullString()},
			contract_termination_date: { valueRaw: contract.termination_date?contract.termination_date:"", value: contract.termination_date?moment(contract.termination_date).format('DD.MM.YYYY'):"", order: contract.termination_date?moment(contract.termination_date).format('YYYY/MM/DD'):""},
			contract_payback_date: { valueRaw: contract.getPaybackDate()?contract.getPaybackDate().format('YYYY-MM-DD'):"", value: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('DD.MM.YYYY'):"", order: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('YYYY/MM/DD'):""},
			contract_status: { valueRaw: contract.getStatus(), value: contract.getStatus() },
			contract_has_interest: { valueRaw: contract.interest_rate > 0, value: contract.interest_rate > 0 }
		};
	}

	contract.prototype.isTerminated = function (date) {
		// check if all money was paid back until given date
		var count = 0;
		var toDate = date;
		this.transactions.forEach(function(transaction) {
			if (moment(toDate).diff(transaction.transaction_date) >= 0) {
				count ++;
			}
		});
		var sum = this.getAmountToDate(date, undefined);
		return count > 1 && sum <= 0;
	};


	contract.prototype.getTerminationType = function () {
		return this.termination_type || settings.project.get('defaults.termination_type') || 'T';
	};

	contract.prototype.getTerminationPeriod = function () {
		return this.termination_period || settings.project.get('defaults.termination_period') || 6;
	};

	contract.prototype.getTerminationPeriodType = function () {
		return this.termination_period_type || settings.project.get('defaults.termination_period_type') || 6;
	};

	contract.prototype.getInterestPaymentType = function () {
		return this.interest_payment_type || settings.project.get('defaults.interest_payment_type') || 'end';
	};


	contract.getTerminationTypeFullString = function (type, period, period_type, noPeriod = false) {
		if (type === "P") {
			return _t('termination_type_P') + " - " + period + " " + _t('termination_period_type_' + period_type);
		} else if (type === "D") {
			return _t('termination_type_D');
		} else if (type === "T") {
			return _t('termination_type_T') + (noPeriod?"":" - " + period + " " + _t('termination_period_type_' + period_type));
		}
	};

	contract.prototype.getTerminationTypeFullString = function (noPeriod = false) {
		return contract.getTerminationTypeFullString(this.getTerminationType(), this.getTerminationPeriod(), this.getTerminationPeriodType(), noPeriod);
	};

	contract.prototype.getPaybackDate = function () {
		if (this.getTerminationType() == "P") {
			return moment(this.sign_date).add(this.getTerminationPeriod(), this.getTerminationPeriodType());
		} else if (this.getTerminationType() == "D") {
			return moment(this.termination_date);
		} else if (this.getTerminationType() == "T") {
			if (this.termination_date) {
				return moment(this.termination_date).add(this.getTerminationPeriod(), this.getTerminationPeriodType());
			} else {
				return null;
			}
		}
	};

	contract.prototype.getFetchedTransactions = function () {
		return this.transactions;
	};

	contract.prototype.getStatus = function () {
		return this.isTerminated(moment())? "Zurückbezahlt" : (this.transactions.length == 0 ? "Noch nicht eingezahlt":"Laufend");
	};

	contract.prototype.getStatusText = function() {
		switch(this.status) {
			case "unknown":
			return 'Noch kein Vertrag';
			case "sign":
			return 'Vertrag ist zu unterschreiben';
			case "sent":
			return 'Vertrag ist verschickt';
			case "complete":
			return 'Vertrag abgeschlossen ';
		}
		return "Unbekannt";
	};

	contract.prototype.getLink = function () {
		return `<a href="/user/show/${this.user.id}#show_contract_${this.id}">${moment(this.sign_date).format('DD.MM.YYYY')}</a>`;
	}

	contract.prototype.getDescriptor = function (models) {
		return `Vertrag vom ${this.getLink()} von ${this.user.getLink()}`;
	};

	contract.prototype.sortTransactions = function () {
		this.transactions.sort(function(a,b) {
			if (a.transaction_date > b.transaction_date)
				return 1;
			else if(b.transaction_date > a.transaction_date)
				return -1;
			else
				return 0;
		});
	};

	contract.prototype.getAmountToDate = function (date, currentTransactionId) {
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (moment(date).diff(transaction.transaction_date) >= 0 && transaction.id != currentTransactionId) {
				sum += transaction.amount + transaction.interestToDate(contract.interest_rate, date);
			}
		});
		if (sum > 0) {
			return sum;
		} else {
			return 0;
		}
	};

	contract.prototype.getInterestToDate = function (date) {
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (moment(date).diff(transaction.transaction_date) >= 0) {
				sum += transaction.interestToDate(contract.interest_rate, date);
			}
		});
		if (sum > 0) {
			return sum;
		} else {
			return 0;
		}
	};

	contract.prototype.getInterestOfYear = function (year) {
		var sum = 0;
		var contract = this;
		var year_begin = moment(year+'-01-01').startOf("year");
		var year_end = moment(year+'-01-01').add(1,'years');
		this.transactions.forEach(function(transaction) {
			if (year_end.diff(transaction.transaction_date) > 0) {
				sum += transaction.interestToDate(contract.interest_rate, year_end);
				sum -= transaction.interestToDate(contract.interest_rate, year_begin);
			}
		});
		if (sum > 0) {
			return sum;
		} else {
			return 0;
		}
	};

	contract.prototype.getTransactionsAmount = function () {
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			sum += transaction.amount;
		});
		return sum;
	};

	contract.prototype.getDepositAmount = function () {
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (transaction.amount > 0) {
				sum += transaction.amount;
			}
		});
		return sum;
	};

	contract.prototype.getWithdrawalAmount = function () {
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (transaction.amount < 0) {
				sum += transaction.amount;
			}
		});
		return sum;
	};

	contract.prototype.isCancelledAndNotRepaid = function (date) {
	    // check if all money was paid back until given date
	    var sum = 0;
	    var count = 0;
	    var toDate = date;
	    this.transactions.forEach(function(transaction) {
	    	if (moment(toDate).diff(transaction.transaction_date) >= 0) {
		        count ++;
		        sum += transaction.amount;
		    }
		});
	    var cancelled = sum > 0 && this.termination_date != null;
	    var terminated = false;
	    if (this.termination_date || this.getTerminationType() == "P" || this.getTerminationType() == "D") {
	    	terminated = true;
	    }
	    return sum > 0 && terminated;
	};

	return contract;
};
