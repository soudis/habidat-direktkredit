const moment = require('moment');
const settings = require('../utils/settings');

module.exports = (sequelize, DataTypes) => {
		transaction = sequelize.define('transaction', {
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
		    		  	if (this.type === 'withdrawal' || this.type === 'termination' || this.type === 'notreclaimed'){
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
			freezeTableName: true
		}
	);

	transaction.associate = function (db) {
		db.transaction.belongsTo(db.contract, {
			onDelete: "CASCADE",
			foreignKey: 'contract_id'
		});
	}  

	transaction.prototype.getTypeText = function () {
		switch(this.type) {
			case "initial": 
			return 'Einzahlung';
			case "deposit": 
			return 'Zusatzzahlung';
			case "withdrawal":
			return 'Teilauszahlung';
			case "termination":
			return 'Rückzahlung';
			case "notreclaimed":
			return 'Nicht rückgefordert';
		}

		return "Unbekannt";
	}

	transaction.prototype.interestToDate = function (rate, toDate) {      
		if (rate > 0 && moment(toDate).diff(this.transaction_date) >= 0) {
			var method = settings.project.get('defaults.interest_method') || '365_compound';
			var method_days = 365;
			var amountWithInterest = this.amount;
			var fromDate = this.transaction_date;
			var endOfYear = moment(fromDate).endOf('year');
	      	// if toDate is before end of year
	      	if (endOfYear.diff(toDate) >= 0) {
	        	// calculation interest until toDate
	        	amountWithInterest += amountWithInterest * rate / 100 * moment(toDate).diff(fromDate, 'days') / method_days;
	      	// if toDate is after end of year
	  		} else {
	        	// calculation interest until end of first year
	        	amountWithInterest += amountWithInterest * rate / 100 * endOfYear.diff(fromDate, 'days') / method_days;

	        	// calculation interest for all full years
	        	var years = moment(toDate).diff(endOfYear, 'years');
	        	if (years > 0) {
	        		if (method === '365_nocompound') {
	        			amountWithInterest += this.amount * rate / 100 * years;
	        		} else {
	        			amountWithInterest = amountWithInterest * Math.pow(1+rate/100, years);
	        		}
	        	}

	        	//calculate interest for remaining days in last year
	        	if (method === '365_nocompound') {
	        		amountWithInterest += this.amount * rate / 100 * moment(toDate).diff(endOfYear.add(years, 'years'),'days') / method_days;
	        	} else {
	        		amountWithInterest += amountWithInterest * rate / 100 * moment(toDate).diff(endOfYear.add(years, 'years'),'days') / method_days;            
	        	}
	    	}
	    	return amountWithInterest - this.amount;
		} else {
			return 0;
		}
	}

	return transaction;
};
