const security = require('../utils/security');
const moment = require("moment");
const statistics = require('../utils/statistics');
const utils = require('../utils')
const router = require('express').Router();
const models  = require('../models');
const format = require('../utils/format');
const settings = require('../utils/settings');


module.exports = function(app){

	router.get('/statistics/downloads', security.isLoggedInAdmin, function(req, res) {
		res.render('statistics/downloads', { title: 'Downloads'});
	});

	router.get('/statistics/numbers', security.isLoggedInAdmin, function(req, res, next) {
		statistics.getNumbers()
			.then(numbers => {
				res.render('statistics/numbers', { title: 'Zahlen, Daten, Fakten', "numbers": numbers});
			})
			.catch(next);
	});

	router.get('/statistics/byrelation/:start/:end', security.isLoggedInAdmin, (req, res) => {
		models.user.findAll({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var endDate = moment(req.params.end, 'DD.MM.YYYY').endOf('month');
			var startDate = moment(req.params.start, 'DD.MM.YYYY');				
			var byRelation = {};
			var today = moment();
			users.forEach((user) => {
				if (!byRelation[user.relationship]) {
					byRelation[user.relationship] = 0;
				}
				user.contracts.forEach((contract) => {
					if (moment(contract.sign_date).isBetween(startDate, endDate)) {
						byRelation[user.relationship] += contract.getAmountToDate(endDate);
					}
				})
			})
			Object.keys(byRelation).forEach(key => {
				byRelation[key] = Math.round(byRelation[key]*100)/100;
			})
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify(byRelation));
		});
	});
	
	router.get('/statistics/byregion/:level/:start/:end', security.isLoggedInAdmin, (req, res, next) => {
		models.user.findAll({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var endDate = moment(req.params.end, 'DD.MM.YYYY').endOf('month');
			var startDate = moment(req.params.start, 'DD.MM.YYYY');			
			var sections = {};
			var total = 0;
			var today = moment();
			users.forEach((user) => {
				var key = "Sonstige", skip = false;				
				var country = user.country || settings.project.get('defaults.country') || 'AT';
				if (req.params.level === 'country') {
					key = country;
				} else if (req.params.level.startsWith('zip-')) {
					var levelParts = req.params.level.split('-');
					if (levelParts[1] != country) {
						// skip if wrong country
						skip = true;
					} else {
						if (levelParts.length === 3) {
							if (!user.zip || !user.zip.startsWith(levelParts[2])) {
								// skip if wrong zip region
								skip = true;	
							} else {
								key = levelParts[1] + '-' + user.zip.substring(0,levelParts[2].length+1);
							}		
						} else {
							if (!user.zip) {
								skip = true
							} else {
								key = levelParts[1] + '-' + user.zip.substring(0,1);
							}							
						}
					}
				}
				
				if (!sections[key]) {
					sections[key] = 0;
				}
				user.contracts.forEach((contract) => {
					if (moment(contract.sign_date).isBetween(startDate, endDate)) {
						var amount = contract.getAmountToDate(endDate);
						if (!skip) {
							sections[key] += amount;
						}					
						total += amount;
					}
				})
			})
			var result = {};
			Object.keys(sections).forEach((section) => {
				var percent = 100*sections[section] / total
				result[section + ' (' + format.format(percent, 2, '#%') + ')'] = Math.round(sections[section]*100)/100;
			})
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify(result));
		})
		.catch(error => next(error));
	});	

	router.get('/statistics/bymonth/:start/:end', security.isLoggedInAdmin, (req, res) => {
		models.user.findAll({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var endDate = moment(req.params.end, 'DD.MM.YYYY');
			var startDate = moment(req.params.start, 'DD.MM.YYYY');
			var months = [];
			for (var i = Math.abs(endDate.diff(startDate,'months')); i>=0; i--) {
				months.push(moment(endDate).subtract(1*i, 'months').endOf('month'));
			}
			//console.log("months: " + JSON.stringify(months));
			var byMonth = {};
			months.forEach((month)  => {
				sum = 0;
				users.forEach((user) => {
					user.contracts.forEach((contract) => {
						var contractAmount = contract.getAmountToDate(month);
						//console.log("contract: " + contract.id + ", " + contractAmount);
						sum+= contractAmount;

					})
				})
				byMonth[month.format('MM YYYY')]  = Math.round(sum*100)/100;
			})			
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify(byMonth));
		});
	});	

	router.get('/statistics/transactionsbymonth/:start/:end', security.isLoggedInAdmin, (req, res) => {
		models.user.findAll({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var endDate = moment(req.params.end, 'DD.MM.YYYY');
			var startDate = moment(req.params.start, 'DD.MM.YYYY');
			var months = [];
			for (var i = Math.abs(endDate.diff(startDate,'months')); i>=0; i--) {
				months.push(moment(endDate).subtract(1*i, 'months').endOf('month'));
			}
			//console.log("months: " + JSON.stringify(months));
			var byMonth = { deposits: {}, withdrawals: {}, interest: {}, notReclaimed: {}};
			months.forEach((month)  => {
				var start = moment(month).startOf('month');
				var end = month;
				//console.log("start " + start + " end " + end);
				var deposits = 0, withdrawals = 0, interest = 0, notReclaimed = 0;
				users.forEach((user) => {
					user.contracts.forEach((contract) => {
						contract.transactions.forEach((transaction) => {
							if (start.diff(transaction.transaction_date) <= 0 && end.diff(transaction.transaction_date) >= 0) {
								if (transaction.amount > 0) {
									deposits += transaction.amount;
								} else {
									if (transaction.type === 'notreclaimed') {
										notReclaimed += transaction.amount;
									} else {
										withdrawals += transaction.amount;
									}									
								}
							}
							interest += transaction.interestToDate(contract.interest_rate, end) - transaction.interestToDate(contract.interest_rate, start);
						});
					})
				})
				byMonth.deposits[month.format('MM YYYY')]  = Math.round(deposits*100)/100;
				byMonth.withdrawals[month.format('MM YYYY')]  = Math.round(-withdrawals*100)/100;
				byMonth.notReclaimed[month.format('MM YYYY')]  = Math.round(-notReclaimed*100)/100;
				byMonth.interest[month.format('MM YYYY')]  = Math.round(interest*100)/100;
			})			
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify(byMonth));
		});
	});	


	router.post('/statistics/transactionList', security.isLoggedInAdmin, function(req, res) {
		models.user.findAll({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var transactionList = [];
			users.forEach(function(user) {
				user.getTransactionList(req.body.year).forEach( function (transaction) {
					transactionList.push(transaction);
				});
			});
			transactionList.sort(function(a,b) {
				if (a.date.diff(b.date) > 0)
					return 1;
				else if(b.date.diff(a.date) > 0)
					return -1;
				else {
					var comp = new String(a.last_name).localeCompare(b.last_name);
					if (comp === 0)	{
						return new String(a.first_name).localeCompare(b.first_name);
					} else {
						return comp;
					}
				}
			});
			var filename = "./tmp/Jahresliste_"+ req.body.year +".csv"
			file = utils.generateTransactionList(transactionList, filename);

			res.setHeader('Content-Length', (new Buffer(file)).length);
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'inline; filename=Jahresliste_'+ req.body.year +'.csv');
			res.write(file);
			res.end();

		});	
	});

	router.get('/statistics/german', security.isLoggedInAdmin, function(req, res, next) {
		statistics.getGermanContractsByYearAndInterestRate()
			.then(years => {
				//console.log("test: " + JSON.stringify(numbers);
				res.render('statistics/german', { title: 'Deutsche Direktkredite', years: years});
			})
			.catch(error => next(error));
	});	


	app.use('/', router);
};
