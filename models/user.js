  var moment = require('moment');

module.exports = function(sequelize, DataTypes) {
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
      allowNull: false
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
      }
  }, {
    tableName: 'user',
    freezeTableName: true,
    classMethods: {
    	associate: function(db) {
    		db.user.hasMany(db.contract, {
    			as: 'contracts', 
    			foreignKey: 'user_id'});
    		
    		db.user.hasMany(db.file, {
    			as: 'files',
    			foreignKey: 'ref_id',
    			scope: {
    				ref_table: 'user'
    			}
    		});
    	},
    	findByIdFetchFull: function(models, id, callback) {
    		this.find({
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
    		}).then(function(user) {
    			  callback(user);
    		});
    	},
    	findFetchFull : function(models, whereClause, callback) {
    		models.user.findAll({  	      
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
  			}).then(function(users){
  				callback(users);
  			});
    	},
    	aboutToExpire: function(models, whereClause, daysToExpire, callback ){
    		var expires = false;
    		var usersExpired = [];
    		models.user.findFetchFull(models, whereClause, function(users){
    			users.forEach(function(user){
    				user.contracts.forEach(function(contract){
    					if (!contract.isTerminated() && moment(contract.sign_date).add( daysToExpire + contract.period*365, 'days').diff(moment()) <= 0) {
    						expires = true;
    					}
    				});
    				if (expires) {
    					usersExpired.push(user);
    				}
    				expires = false;
    			});
    			callback(usersExpired);  
    		});
      },
      getUsers: function(models, mode, date, callback ){
        var activeUsers = [];
        models.user.findFetchFull(models, ['administrator <> 1'], function(users){
          users.forEach(function(user){
            if(mode == 'all' || user.hasNotTerminatedContracts(date)) {
              activeUsers.push(user);
            }
          });
          callback(activeUsers);  
        });
      },
      cancelledAndNotRepaid: function(models, whereClause, callback ){      
        var cancelled = false;
        var usersCancelled = [];
        models.user.findFetchFull(models, whereClause, function(users){
          users.forEach(function(user){
            user.contracts.forEach(function(contract){
              if (contract.isCancelledAndNotRepaid(moment())) {
                cancelled = true;
              }
            });
            if (cancelled) {
              usersCancelled.push(user);
            }
            cancelled = false;
          });
          callback(usersCancelled);
        });
      }
	},
  	instanceMethods: {
      hasNotTerminatedContracts: function(date) {
        var notTerminated = false;
        this.contracts.forEach(function(contract) {
          if (!(contract.termination_date && moment(contract.termination_date).diff(date) <=0)) {
            notTerminated = true;
          }
        });
        return notTerminated;
      },
  		isActive: function() {
  			var active;
  			this.contracts.forEach(function(contract){
  				if (!contract.isTerminated()) {
  					active = true;
  				}
  			});
  			return active;
  		},
  		isAdmin: function() {
  			if (this.administrator) {
  				return true;
  			}
  		},
  		getAggregateNumbers: function(project) {
  			var aggregate = {contracts: 0, contractAmount: 0, outstandingAmount: 0, paidAmount: 0, repaidAmount: 0, statusContract: null, statusPaid: null, statusRepaid: null};

        // status: 1.. OK, 0.. not OK, 2.. mixed
        var setStatus = (status, value) => {
          if (aggregate[status] == null) {
            aggregate[status] = value;
          } else if (aggregate[status] != value) {
            aggregate[status] = 1;
          }
        }

  			this.contracts.forEach(function(contract) {

          // contract status
  				aggregate.contracts ++;
  				if (contract.status !== "complete") {
  					setStatus('statusContract', 0)
  				} else {
            setStatus('statusContract', 2)
          }

          // get transaction sums
          var sumDeposit = 0, sumWithdrawal = 0;
          contract.transactions.forEach(function (transaction){
            var now = moment();
            if (transaction.amount >= 0) {
              sumDeposit+=transaction.amount;
            } else {
              sumWithdrawal-=transaction.amount;
            }
          });

          // paid status
          if (sumDeposit >= contract.amount) {
            setStatus('statusPaid', 2);
          } else {
            setStatus('statusPaid', 0);
          }

          // repaid status
  				if (contract.termination_date) {
            if (sumWithdrawal >= sumDeposit) {
              setStatus('statusRepaid', 2);
            } else {
              setStatus('statusRepaid', 0);
            }
  				} 

          aggregate.contractAmount += contract.amount;
          aggregate.outstandingAmount += contract.getAmountToDate(project, moment());
          aggregate.paidAmount += sumDeposit;
          aggregate.repaidAmount += sumWithdrawal;

  			});  	
        if (aggregate.statusRepaid == null) {
          aggregate.statusRepaid = 99;
        }
        if (aggregate.statusPaid == null) {
          aggregate.statusPaid = 99;
        }
        if (aggregate.statusContract == null) {
          aggregate.statusContract = 99;
        }        
  			if (aggregate.contracts === 0) {
  				aggregate.statusContract = 0;
  			}
  			return aggregate;
  		},
  		getTransactionList: function(project, year) {
  			var transactionList = [];
  			var user = this;
  			var firstDay = moment(year + " +00:00", "YYYY Z");
  			var firstDayNextYear = moment(year + " +00:00", "YYYY Z").add(1, "years");
  			this.contracts.forEach(function(contract) {
  				var sums = {
  						begin : {
  							amount: 0, 
  							interest:0}, 
  						end : {
  							amount: 0, 
  							interest: 0},
  						transactions : 0
  				} ;
  				if (contract.isTerminated(firstDay) === false) {
  					contract.transactions.forEach(function(transaction) {
  						if (firstDay.diff(transaction.transaction_date) >= 0) {
  							sums.begin.amount += transaction.amount;
  							sums.begin.interest += + transaction.interestToDate(project, contract.interest_rate, firstDay);
  							sums.end.amount += transaction.amount;
  							sums.end.interest += + transaction.interestToDate(project, contract.interest_rate, firstDayNextYear);
  						} else  if ( firstDay.diff(transaction.transaction_date) < 0 && firstDayNextYear.diff(transaction.transaction_date) >= 0) {
  							var trans =  {
  									id : user.id,
  									last_name: user.last_name,
  									first_name: user.first_name,
  									contract_id: contract.id,
  									interest_rate: contract.interest_rate,
  									date: moment(transaction.transaction_date),
  									type: "Zahlung",
  									amount: transaction.amount,
  									interest: ""
  							};
                if (transaction.type === 'notreclaimed') {
                  trans.type = "Nicht rückgefordert"
                }
  							transactionList.push(trans);
  							sums.transactions++;
  							
  							sums.end.amount += transaction.amount;
  							sums.end.interest += + transaction.interestToDate(project, contract.interest_rate, firstDayNextYear);

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
  	  							type: 'Kontostand',
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
  								type: 'Kontostand',
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
  							date: moment(firstDayNextYear).subtract(1, 'days'),
  							type: 'Zinsertrag ' + year,
  							amount: sums.end.interest - sums.begin.interest,
  							interest: ""
  					};
  					transactionList.push(interest);
  				}
  			});
  			return transactionList;
  		}
  	},
  	hooks: {
        beforeCreate: function (user, options) {
          if (!user.administrator) {
            user.logon_id = Math.abs(Math.random() * 100000000);
          }
            //console.log("logonid" + user.logon_id);
        },
  		afterCreate: function(user, options) {
        if (!user.administrator) {
    		  var id = user.id + 10000;
    		  return user.update({
    		    logon_id: id + "_" + global.project.usersuffix
    		  }, {
    		    where: {
    		      id: user.id
    		    }
    		  });
        }
  		}
    }
  });
  return User;
};
