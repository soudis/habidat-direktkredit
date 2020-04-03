var moment = require("moment");
var sequelize = require("sequelize");
var Op = require("sequelize").Op;


var chartColors = [
	"#a6cee3",
	"#1f78b4",
	"#b2df8a",
	"#33a02c",
	"#fb9a99",
	"#e31a1c",
	"#fdbf6f",
	"#ff7f00",
	"#cab2d6",
	"#6a3d9a",
	"#ffff99",
	"#b15928"
];
	
var generatePieChart = function(data, callback) {
	var chartData = [];
	var index = 0;
	for(var label in data)
	{
		var value = data[label];

		chartData.push({value: value, color: chartColors[index], label:label});
		index++;

	}
	
	var Canvas = require('canvas')
	  , canvas = new Canvas(800, 800)
	  , ctx = canvas.getContext('2d')
	  , Chart = require('nchart')
	  , fs = require('fs');
	
	new Chart(ctx).Pie(
		    chartData
		);
	callback(canvas.toBuffer().toString('base64'));
};

exports.getGermanContractsByYearAndInterestRate = function(models, callback) {

	// find all german contracts (NOTE: distinction is just by
    // length of ZIP code > 4)
	models.user.findAll({
		  where: { country: 'DE' },
		  include:{
				model: models.contract,
				as: 'contracts',
				include : {
					model: models.transaction,
					as: 'transactions'
				}
			}
	}).then(function(users){
		// find first contract to have start date
		var first = moment();
		users.forEach(function(user) {
			user.contracts.forEach(function(contract) {
				if (first.diff(moment(contract.sign_date)) > 0) {
					first = moment(contract.sign_date);
				}
			});
		});

        // init array for years since first contract
 	    var result = [];
		var years = Math.ceil(Math.abs(moment().diff(first,'days')/365));
		for(var i = 0; i<years;i++) {
			result.push({
				year: i+1, 
				from: moment(first).add(i, 'years'), 
				to: moment(first).add(i+1, 'years').add(-1,'days'), 
				rates: []});
		}

        // iterate all contracts and push contracts in
        // right year and right intest rate array
		users.forEach(function(user) {
			user.contracts.forEach(function(contract) {
				var year;
				if (moment(contract.sign_date).isValid()) {
					year = Math.floor(Math.abs(moment(contract.sign_date).diff(first,'days')/365));
				} else {
					year = years-1;
				}
				var rate = Math.round(contract.interest_rate*10)/10;

				var findRate = function(rates, rate) {
					var found = -1;
					for (var i = 0; i< rates.length; i++) {
						if (rates[i].interest_rate === rate) {
							found = i;
						}
					};
					return found;
				};

				// see if rate already exists and push it if not
				var rateIndex = findRate(result[year].rates, rate);
				if (rateIndex === -1) {
					result[year].rates.push({interest_rate: rate, total_amount: 0, contracts : []});					
					rateIndex = result[year].rates.length-1;
				}

				// add contract to year and rate and increase total amount
				result[year].rates[rateIndex].total_amount += contract.amount;
				contract.user=user;
				result[year].rates[rateIndex].contracts.push(contract);
			});
		});		
		
		callback(result);

	});
};

exports.getNumbers = function(models, project, callback){

	var contractHelper = [];

	var numbers = {
			total : {
				amount : 0,
				contractAmount: 0,
				deposits: 0,
				withdrawals: 0,
				notReclaimed: 0,
				outstandingAmount: 0,
				interestToDate : 0,

				avgAmount : 0,
				medianAmount: 0,

				count : 0,

				interestPaid : 0,
				avgInterestRate : 0,
				medianInterestRate : 0,

				users: 0
			},
			running : {
				amount :0,
				contractAmount: 0,
				deposits: 0,
				withdrawals: 0,
				notReclaimed: 0,				
				outstandingAmount: 0,
				interestToDate : 0,
				avgAmount : 0,
				count :0,
				avgInterestRate :0,
				users: 0
			},
			cancelled : {
				amount :0,
				contractAmount: 0,
				deposits: 0,
				withdrawals: 0,
				interestPaid: 0,
				notReclaimed: 0,

				avgAmount : 0,
				count :0,
				avgInterestRate :0,
				users: 0,
				avgDaysToRepay: 0,
				avgDaysToRepayCount: 0
			},
			lastMonth : {
				amountNew : 0,
				amountCancelled : 0,
				countNew : 0,
				countCancelled : 0

			},
			lastYear : {
				amountNew : 0,
				amountCancelled : 0,
				countNew : 0,
				countCancelled : 0
			},
			byRelationship: {},
			charts:{}


	};


	var lastMonth = moment().subtract(1, "months");
	var lastYear = moment().subtract(1,"year");
	var now = moment();

	models.user.findAll({
		  where: { administrator: {[Op.not]: '1'}},
		  include:{
				model: models.contract,
				as: 'contracts',
				include : {
					model: models.transaction,
					as: 'transactions'
				}
			}
		}).then(function(users){

			users.forEach(function(user){

				hasNotTerminatedContracts = false;

				user.contracts.forEach(function (contract) {

					var deposits = 0,
						withdrawals = 0,
						interest = 0,
						notReclaimed = 0,
						lastTransaction;

					contract.transactions.forEach(function (transaction) {

						//toDate = transaction.interestToDate(contract.interest_rate, now);
						//console.log("user: " + user.first_name + " " + user.last_name + ", now: " + now + ", transactions(date, amount):" + transaction.transaction_date + ", " + transaction.amount +" interest: " + toDate);
						interest += transaction.interestToDate(project, contract.interest_rate, now);
						// general statistics
						if (transaction.amount > 0) {
							deposits += transaction.amount;
						} else {
							withdrawals += transaction.amount;
							if (transaction.type === 'notreclaimed') {
								notReclaimed += transaction.amount;
							}							
						}

						// last month statistics
						if (moment(transaction.transaction_date).diff(lastMonth) > 0) {
							if (transaction.amount > 0) {
								numbers.lastMonth.amountNew += transaction.amount;
								numbers.lastMonth.countNew ++;
							} else {
								numbers.lastMonth.amountCancelled += transaction.amount;
								numbers.lastMonth.countCancelled ++;
							}
						}

						// last year statistics
						if (moment(transaction.transaction_date).diff(lastYear) > 0) {
							if (transaction.amount > 0) {
								numbers.lastYear.amountNew += transaction.amount;
								numbers.lastYear.countNew ++;
							} else {
								numbers.lastYear.amountCancelled += transaction.amount;
								numbers.lastYear.countCancelled ++;
							}
						}

						lastTransaction = transaction.transaction_date;

					});

					// general statistics
					numbers.total.amount += deposits;
					numbers.total.avgInterestRate += contract.amount * contract.interest_rate;
					numbers.total.count ++;

					if (contract.isTerminated(now)) {
						numbers.cancelled.count ++;
						numbers.cancelled.amount += deposits;
						numbers.cancelled.avgInterestRate  += contract.amount * contract.interest_rate;


						numbers.cancelled.contractAmount += contract.amount;
						numbers.cancelled.deposits += deposits;
						numbers.cancelled.withdrawals -= withdrawals - notReclaimed;
						numbers.cancelled.notReclaimed -= notReclaimed;
						numbers.cancelled.interestPaid -= deposits + withdrawals - notReclaimed;	
						if (lastTransaction && contract.termination_date && (!contract.termination_type || contract.termination_type == "T")) {
							var daysToRepay = moment(lastTransaction).diff(moment(contract.termination_date), 'days');
							if (daysToRepay > 0) {
								numbers.cancelled.avgDaysToRepay += daysToRepay;
								numbers.cancelled.avgDaysToRepayCount ++;
							}
						}

						numbers.total.contractAmount += contract.amount;
						numbers.total.deposits += deposits;
						numbers.total.withdrawals -= withdrawals - notReclaimed;
						numbers.total.notReclaimed -= notReclaimed;
						numbers.total.interestPaid -= deposits + withdrawals - notReclaimed;

					} else {
						hasNotTerminatedContracts = true;
						numbers.running.count ++;
						numbers.running.amount += deposits;
						numbers.running.avgInterestRate  += contract.amount * contract.interest_rate;

						numbers.running.contractAmount += contract.amount;
						numbers.running.deposits += deposits;
						numbers.running.withdrawals -= withdrawals - notReclaimed;
						numbers.running.notReclaimed -= notReclaimed;
						numbers.running.outstandingAmount += deposits + withdrawals + interest;
						numbers.running.interestToDate += interest;

						numbers.total.contractAmount += contract.amount;
						numbers.total.deposits += deposits;
						numbers.total.withdrawals -= withdrawals - notReclaimed;
						numbers.total.notReclaimed -= notReclaimed;
						numbers.total.outstandingAmount += deposits + withdrawals + interest;
						numbers.total.interestToDate += interest;
					}
					
					if(numbers.byRelationship[user.relationhip]) {
						numbers.byRelationship[user.relationship] += contract.amount;
					} else {
						numbers.byRelationship[user.relationship] = contract.amount;
					}

					contractHelper.push ({
						interestRate : contract.interest_rate,
						amount : contract.amount
						});

				});

				if (hasNotTerminatedContracts) {
					numbers.running.users ++;
				} else {
					numbers.cancelled.users ++;
				}
				numbers.total.users++;


			});

		numbers.total.avgInterestRate = numbers.total.avgInterestRate / numbers.total.contractAmount;
		numbers.running.avgInterestRate = numbers.running.avgInterestRate / numbers.running.contractAmount;
		numbers.cancelled.avgInterestRate = numbers.cancelled.avgInterestRate / numbers.cancelled.contractAmount;

		contractHelper.sort(function(a,b) {
			if (a.interestRate > b.interestRate)
				return 1;
			else if(b.interestRate > a.interestRate)
				return -1;
			else
				return 0;
		});

		if (numbers.total.count > 2) {
			numbers.total.medianInterestRate = contractHelper[Math.ceil(numbers.total.count/2)].interestRate;
		} else {
			numbers.total.medianInterestRate = 0;
		}

		contractHelper.sort(function(a,b) {
			if (a.amount > b.amount)
				return 1;
			else if(b.amount > a.amount)
				return -1;
			else
				return 0;
		});

		if (numbers.total.count > 2) {
		 	numbers.total.medianAmount = contractHelper[Math.ceil(numbers.total.count/2)].amount;
		} else {
			numbers.total.medianAmount = 0;
		}


		numbers.total.avgAmount = numbers.total.contractAmount / numbers.total.count;
		numbers.cancelled.avgAmount = numbers.cancelled.contractAmount / numbers.cancelled.count;
		numbers.running.avgAmount = numbers.running.contractAmount / numbers.running.count;

		numbers.cancelled.avgDaysToRepay = numbers.cancelled.avgDaysToRepay / numbers.cancelled.avgDaysToRepayCount;
		
/*		generatePieChart(numbers.byRelationship, function(chart) {
			numbers.charts.byRelationship = chart;
		});*/

		callback(numbers);
	});

};

