var moment = require('moment');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('contract', {
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
    termination_date: {
      type: DataTypes.DATE,
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
    period: {
      type: DataTypes.FLOAT,
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
    freezeTableName: true,
    classMethods: {
    	associate: function(db) {
    		db.contract.hasMany(db.transaction, {
    			as: 'transactions', 
    			foreignKey: 'contract_id'
    		});
    		db.contract.belongsTo(db.user, {
    	          onDelete: "CASCADE",
    	          foreignKey: 'user_id',
    	          as: 'contracts'
    	        });
    	}
    },
    instanceMethods: {
  		calculateInterest: function() {
  			var interest = {"now": 0.00, "last_year": 0.00};
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
  				});
  				interest.now = Math.ceil(interest.now*100) / 100;
  			}
  			return interest;
  		},
  		getFetchedTransactions: function() {
  			return this.transactions;
  		},
  		getStatus: function() {
  			return this.termination_date? "Gekündigt" : "Laufend";
  		},
  		getStatusText: function() {
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
		},
		sortTransactions: function() {
			this.transactions.sort(function(a,b) {
				if (a.transaction_date > b.transaction_date)
					return 1;
				else if(b.transaction_date > a.transaction_date)
					return -1;
				else
					return 0;
			});
		},
		isTerminated : function(date) {
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
			return count > 1 && sum <= 0 && this.termination_date;
		},
    getAmountToDate : function(date) {    
      var sum = 0;
      var contract = this;
      this.transactions.forEach(function(transaction) {
        if (moment(date).diff(transaction.transaction_date) >= 0) {
          sum += transaction.amount + transaction.interestToDate(contract.interest_rate, date);
        }
      });
      if (sum > 0) {
        return sum;
      } else {
        return 0;
      }      
    },
    isCancelledAndNotRepaid : function(date) {
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
      return sum > 0 && this.termination_date != null;
    }
  }
  });
};
