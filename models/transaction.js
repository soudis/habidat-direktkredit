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
		interestToDate: function(rate, date) {      
			if (rate > 0 && moment(date).diff(this.transaction_date) >= 0) {
				return this.amount * Math.pow (1+(rate/100), moment(date).diff(this.transaction_date, 'days') / 365) - this.amount;
			} else
				return 0;
		}
    }
  });
};
