const moment = require('moment');
const settings = require('../utils/settings');

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
	}

	contract.findByIdFetchFull = function (models, id) {
		return models.contract.findOne({ where : { id: id }, include: [{model: models.transaction, as: "transactions"}]});
	}    

	contract.prototype.isTerminated = function (date) {
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
		return count > 1 && sum <= 0;
	}


	contract.prototype.getTerminationType = function () {
		return this.termination_type || settings.project.get('defaults.termination_type') || 'T';  	
	}

	contract.prototype.getTerminationPeriod = function () {
		return this.termination_period || settings.project.get('defaults.termination_period') || 6;
	}

	contract.prototype.getTerminationPeriodType = function () {
		return this.termination_period_type || settings.project.get('defaults.termination_period_type') || 6;
	}

	contract.prototype.getTerminationTypeString = function () {
		switch(this.getTerminationType()) {
			case "T": 
			return 'Kündigungsfrist';
			case "P": 
			return 'Laufzeit';
			case "D":
			return 'Enddatum';
		}
		return "Kündigungsfrist";
	}

	contract.prototype.getTerminationPeriodTypeString = function () {
		switch(this.getTerminationPeriodType()) {
			case "M": 
			return 'Monat(e)';
			case "w": 
			return 'Woche(n)';
			case "Y":
			return 'Jahr(e)';
		}
		return "Monat(e)";
	}

	contract.prototype.getTerminationTypeFullString = function (noPeriod = false) {
		if (this.getTerminationType() == "P") {
			return this.getTerminationTypeString() + " - " + this.getTerminationPeriod() + " " + this.getTerminationPeriodTypeString();
		} else if (this.getTerminationType()== "D") {
			return this.getTerminationTypeString();
		} else if (this.getTerminationType() == "T") {
			return this.getTerminationTypeString() + (noPeriod?"":" - " + this.getTerminationPeriod() + " " + this.getTerminationPeriodTypeString());
		}    
	}


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
	}  

	contract.prototype.calculateInterest = function () {
		var interest = {"now": 0.00, "last_year": 0.00, "termination": 0.00};
		var last_year_end = moment().startOf("year");
		var last_year_begin = moment().subtract(1, "years").startOf("year");
		var now = moment();

		var contract = this;
		interest.last_year_no = last_year_begin.year();

		var terminatedLastYear = contract.isTerminated(last_year_end);

		if (contract.isTerminated(now)) {
			this.transactions.forEach(function(transaction) {
				interest.now += transaction.amount;
				if (terminatedLastYear) {
					interest.last_year += transaction.amount;
				} else if (last_year_end.diff(transaction.transaction_date, 'days') > 0)  {
					interest.last_year += transaction.interestToDate(contract.interest_rate, last_year_end);
					interest.last_year -= transaction.interestToDate(contract.interest_rate, last_year_begin);
				}
			});  	
			interest.now = Math.abs(interest.now);
			interest.last_year = Math.abs(interest.last_year);
		} else {
			this.transactions.forEach(function(transaction) {
				interest.now += transaction.interestToDate(contract.interest_rate, now);
				interest.last_year += transaction.interestToDate(contract.interest_rate, last_year_end);
				interest.last_year -= transaction.interestToDate(contract.interest_rate, last_year_begin);
				if (contract.termination_date) {
					interest.termination += transaction.interestToDate(contract.interest_rate, moment(contract.termination_date));
				}
			});
			interest.now = Math.ceil(interest.now*100) / 100;
			interest.termination = Math.ceil(interest.termination*100) / 100;
		}
		return interest;
	}

	contract.prototype.getFetchedTransactions = function () {
		return this.transactions;
	}

	contract.prototype.getStatus = function () {
		return this.isTerminated(moment())? "Zurückbezahlt" : (this.transactions.length == 0 ? "Noch nicht eingezahlt":"Laufend");
	}

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
	}


	contract.prototype.sortTransactions = function () {
		this.transactions.sort(function(a,b) {
			if (a.transaction_date > b.transaction_date)
				return 1;
			else if(b.transaction_date > a.transaction_date)
				return -1;
			else
				return 0;
		});
	}

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
	}

	contract.prototype.getTransactionsAmount = function () {    
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			sum += transaction.amount;
		});
		return sum;
	}

	contract.prototype.getDepositAmount = function () {    
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (transaction.amount > 0) {
				sum += transaction.amount;        
			}
		});
		return sum;
	}  

	contract.prototype.getWithdrawalAmount = function () {    
		var sum = 0;
		var contract = this;
		this.transactions.forEach(function(transaction) {
			if (transaction.amount < 0) {
				sum += transaction.amount;        
			}
		});
		return sum;
	}  

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
	}

	return contract;
};
