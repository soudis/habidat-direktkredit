var moment = require('moment');


module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transaction', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    contract_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'contract',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
    	  isValid: function(value) {
    		  //console.log("value " + this.type);
    		  if (this.type === 'withdrawal' || this.type === 'termination'){
    			  if (value >= 0) {
    				  throw new Error("Rückzahlungen müssen negativ sein");
    			  }
    		  } else {
    			  if (value <= 0) {
    				  throw new Error("Einzahlungen müssen positiv sein");
    			  }
    		  }
    	  }
      }
    }
  }, {
    tableName: 'transaction',
    freezeTableName: true,
    classMethods: {
    	associate: function(db) {
    		db.transaction.belongsTo(db.contract, {
    	          onDelete: "CASCADE",
    	          foreignKey: 'contract_id',
    	          as: 'transactions'
    	        });
    	}
    },
    instanceMethods: {
		getTypeText: function() {
			switch(this.type) {
			case "initial": 
				return 'Einzahlung';
			case "deposit": 
				return 'Zusatzzahlung';
			case "withdrawal":
				return 'Teilauszahlung';
			case "termination":
				return 'Rückzahlung';
			}
			return "Unbekannt";
		},
		interestToDate: function(rate, toDate) {      

      if (rate > 0 && moment(toDate).diff(this.transaction_date) >= 0) {
        const method = 365;

        var amountWithInterest = this.amount;
        var fromDate = this.transaction_date;
        var endOfYear = moment(fromDate).endOf('year');
        // if toDate is before end of year
        if (endOfYear.diff(toDate) >= 0) {
          // calculation interest until toDate
          amountWithInterest += amountWithInterest * rate / 100 * toDate.diff(fromDate, 'days') / method;
        // if toDate is after end of year
        } else {
          // calculation interest until end of first year
          amountWithInterest += amountWithInterest * rate / 100 * endOfYear.diff(fromDate, 'days') / method;

          // calculation interest for all full years
          var years = toDate.diff(endOfYear, 'years');
          if (years > 0) {
            amountWithInterest = amountWithInterest * Math.pow(1+rate/100, years);
          }

          //calculate interest for remaining days in last year
          amountWithInterest += amountWithInterest * rate / 100 * toDate.diff(endOfYear.add(years, 'years'),'days') / method;
        }
				return amountWithInterest - this.amount;
			} else {
				return 0;
      }
		}
    }
  });
};
