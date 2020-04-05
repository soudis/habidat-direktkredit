var moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  contract = sequelize.define('contract', 
    {
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

  contract.prototype.getTerminationTypeString = function () {
    switch(this.termination_type) {
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
    switch(this.termination_period_type) {
      case "M": 
        return 'Monat(e)';
      case "w": 
        return 'Woche(n)';
      case "Y":
        return 'Jahr(e)';
    }
    return "Monat(e)";
  }

  contract.prototype.getTerminationTypeFullString = function (projectConfig, noPeriod = false) {
    var termination_type = (projectConfig.defaults && projectConfig.defaults.termination_type? projectConfig.defaults.termination_type:"T");
    this.termination_type = (this.termination_type?this.termination_type:termination_type);
    console.log("termination type: " + termination_type);
    if (this.termination_type == "P") {
      var termination_period = (projectConfig.defaults && projectConfig.defaults.termination_period? projectConfig.defaults.termination_period:6);
      this.termination_period = (this.termination_period?this.termination_period:termination_period);
      var termination_period_type = (projectConfig.defaults && projectConfig.defaults.termination_period_type? projectConfig.defaults.termination_period_type:"M");
      this.termination_period_type = (this.termination_period_type?this.termination_period_type:termination_period_type);
      return this.getTerminationTypeString() + " - " + this.termination_period + " " + this.getTerminationPeriodTypeString();
    } else if (this.termination_type == "D") {
      return this.getTerminationTypeString();
    } else if (this.termination_type == "T") {
      var termination_period = (projectConfig.defaults && projectConfig.defaults.termination_period? projectConfig.defaults.termination_period:6);
      this.termination_period = (this.termination_period?this.termination_period:termination_period);
      var termination_period_type = (projectConfig.defaults && projectConfig.defaults.termination_period_type? projectConfig.defaults.termination_period_type:"M");
      this.termination_period_type = (this.termination_period_type?this.termination_period_type:termination_period_type);
      return this.getTerminationTypeString() + (noPeriod?"":" - " + this.termination_period + " " + this.getTerminationPeriodTypeString());
    }    
  }


  contract.prototype.getPaybackDate = function (projectConfig) {
    var termination_type = (projectConfig.defaults && projectConfig.defaults.termination_type? projectConfig.defaults.termination_type:"T");
    this.termination_type = (this.termination_type?this.termination_type:termination_type);
    if (this.termination_type == "P") {
      var termination_period = (projectConfig.defaults && projectConfig.defaults.termination_period? projectConfig.defaults.termination_period:6);
      this.termination_period = (this.termination_period?this.termination_period:termination_period);
      var termination_period_type = (projectConfig.defaults && projectConfig.defaults.termination_period_type? projectConfig.defaults.termination_period_type:"M");
      this.termination_period_type = (this.termination_period_type?this.termination_period_type:termination_period_type);
      return moment(this.sign_date).add(this.termination_period, this.termination_period_type);
    } else if (this.termination_type == "D") {
      return moment(this.termination_date); 
    } else if (this.termination_type == "T") {
      if (this.termination_date) {
        var termination_period = (projectConfig.defaults && projectConfig.defaults.termination_period? projectConfig.defaults.termination_period:6);
        this.termination_period = (this.termination_period?this.termination_period:termination_period);
        var termination_period_type = (projectConfig.defaults && projectConfig.defaults.termination_period_type? projectConfig.defaults.termination_period_type:"M");
        this.termination_period_type = (this.termination_period_type?this.termination_period_type:termination_period_type);
        console.log("DATE: " +moment(this.termination_date).add(this.termination_period, this.termination_period_type));
        return moment(this.termination_date).add(this.termination_period, this.termination_period_type);
      } else {
        return null;
      }      
    }    
  }  

  contract.prototype.calculateInterest = function (project) {
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
					  interest.last_year += transaction.interestToDate(project, contract.interest_rate, last_year_end);
            interest.last_year -= transaction.interestToDate(project, contract.interest_rate, last_year_begin);
					}
				});  	
				interest.now = Math.abs(interest.now);
				interest.last_year = Math.abs(interest.last_year);
			} else {
				this.transactions.forEach(function(transaction) {
					interest.now += transaction.interestToDate(project, contract.interest_rate, now);
          interest.last_year += transaction.interestToDate(project, contract.interest_rate, last_year_end);
          interest.last_year -= transaction.interestToDate(project, contract.interest_rate, last_year_begin);
          if (contract.termination_date) {
            interest.termination += transaction.interestToDate(project, contract.interest_rate, moment(contract.termination_date));
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

  contract.prototype.getAmountToDate = function (project, date, currentTransactionId) {    
    var sum = 0;
    var contract = this;
    this.transactions.forEach(function(transaction) {
      if (moment(date).diff(transaction.transaction_date) >= 0 && transaction.id != currentTransactionId) {        
        sum += transaction.amount + transaction.interestToDate(project, contract.interest_rate, date);
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

  contract.prototype.isCancelledAndNotRepaid = function (projectConfig, date) {
    // check if all money was paid back until given date      
    var sum = 0;
    var count = 0;
    var toDate = date;
    this.transactions.forEach(function(transaction) {
      if (moment(toDate).diff(transaction.transaction_date) >= 0) {
        //console.log('true trans '); 
        count ++;
        sum += transaction.amount;
      }
    });
    var cancelled = sum > 0 && this.termination_date != null;
    //console.log('cancelled: ' + cancelled + ', sum: ' + sum + ', count: ' + count + ', term date: ' + this.termination_date + ', userid: ' + this.user_id);
    var termination_type = projectConfig.defaults && projectConfig.defaults.termination_type?projectConfig.defaults.termination_type:"T";
    var termination_type = this.termination_type?this.termination_type:termination_type;
    var terminated = false;
    if (this.termination_date || termination_type == "P" || termination_type == "D") {
      terminated = true;
    }
    return sum > 0 && terminated;
  }

  return contract;
};
