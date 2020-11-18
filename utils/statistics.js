/* jshint esversion: 8 */
const moment = require("moment");
const sequelize = require("sequelize");
const Op = require("sequelize").Op;
const models = require('../models');


const chartColors = [
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

	var Canvas = require('canvas'),
		canvas = new Canvas(800, 800),
	  	ctx = canvas.getContext('2d'),
	  	Chart = require('nchart'),
	  	fs = require('fs');

	new Chart(ctx).Pie(
		    chartData
		);
	callback(canvas.toBuffer().toString('base64'));
};

exports.getGermanContractsByYearAndInterestRate = function(effectiveDate = undefined, interestRate = undefined, ignoreId = undefined) {
	return models.user.findAll({
		  	where: { country: 'DE' },
		  	include:{
				model: models.contract,
				as: 'contracts'
			}
		}).then(users => {

			// determine begin and end of ṕossible ranges
			var rangesBegin, rangesEnd;
			if (effectiveDate) {
				rangesBegin= moment(effectiveDate).subtract(1, 'y').add(1, 'days');
				rangesEnd = moment(effectiveDate).add(1, 'y').subtract(1, 'days');
			} else {
				rangesBegin = moment('3000-01-01');
				rangesEnd = moment('1900-01-01');
				users.forEach(function(user) {
					user.contracts.forEach(function(contract) {
						if (rangesBegin.isAfter(contract.sign_date)) {
							rangesBegin = moment(contract.sign_date);
						}
						if (rangesEnd.isBefore(contract.sign_date)) {
							rangesEnd = moment(contract.sign_date);
						}
					});
				});
			}

			if (rangesBegin.isSame(moment('1900-01-01'))) {
				return [];
			} else {

				// build all possible year ranges
				var ranges = [];
				for (var i = 0; i <= moment(rangesEnd).add(1,'days').subtract(1, 'years').diff(rangesBegin, 'days'); i++) {
					ranges.push({
						startDate: moment(rangesBegin).add(i, 'days'),
						endDate: moment(rangesBegin).add(i, 'days').add(1, 'years').subtract(1, 'days'),
					});
				}

				// loop over all contracts and assign them to all ranges and build result
				var result = [];
				users.forEach(user => {
					user.contracts.forEach(contract => {
						if ((!interestRate || contract.interest_rate == interestRate) && (!ignoreId || ignoreId != contract.id)) {
							contract.user = user;
							var signDate = moment(contract.sign_date);
							ranges.forEach(range => {
								if (signDate.isSameOrAfter(range.startDate) && signDate.isSameOrBefore(range.endDate)) {
									var entry = result.find(entry => { return entry.startDate.isSame(range.startDate) && entry.endDate.isSame(range.endDate) && entry.interestRate === contract.interest_rate})
									if (!entry) {
										result.push({
											startDate: range.startDate,
											endDate: range.endDate,
											interestRate: contract.interest_rate,
											totalAmount: contract.amount,
											contracts: [contract]
										})
									} else {
										entry.totalAmount += contract.amount;
										entry.contracts.push(contract);
									}
								}
							})
						}
					})
				})

				// sort ranges with largest total amount first
				result.sort((a, b) => {
					return b.totalAmount - a.totalAmount;
				})

				return result;
			}
		});
}

exports.getNumbers = function() {

	var contractHelper = [];

	var numbers = {
			firstContractDate: moment(),
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

	return models.user.findAll({
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

					if (numbers.firstContractDate.isAfter(moment(contract.sign_date))) {
						numbers.firstContractDate = moment(contract.sign_date);
					}

					contract.transactions.forEach(function (transaction) {

						//toDate = transaction.interestToDate(contract.interest_rate, now);
						//console.log("user: " + user.first_name + " " + user.last_name + ", now: " + now + ", transactions(date, amount):" + transaction.transaction_date + ", " + transaction.amount +" interest: " + toDate);
						interest += transaction.interestToDate(contract.interest_rate, now);
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
		return numbers;
	});

};

