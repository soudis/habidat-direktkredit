var security = require('../utils/security');
var moment = require("moment");
var statistics = require('../utils/statistics');
var utils = require('../utils')
var router = require('express').Router();

module.exports = function(app){

	router.get('/statistics/downloads', security.isLoggedInAdmin, function(req, res) {
		res.render('statistics/downloads', { title: 'Downloads'});
	});

	router.get('/statistics/numbers', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);		
		statistics.getNumbers(models, function(numbers) {
			console.log("test: " + numbers.amount);
			res.render('statistics/numbers', { title: 'Zahlen, Daten, Fakten', "numbers": numbers});
		});

	});

	router.get('/statistics/byrelation', security.isLoggedInAdmin, (req, res) => {
		var models  = require('../models')(req.session.project);		
		models.user.all({
			  include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				}
		}).then(function(users) {
			var byRelation = {};
			var today = moment();
			users.forEach((user) => {
				if (!byRelation[user.relationship]) {
					byRelation[user.relationship] = 0;
				}
				user.contracts.forEach((contract) => {
					byRelation[user.relationship] += contract.getAmountToDate(today);
				})
			})
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify(byRelation));
		});
	});
	
	router.post('/statistics/transactionList', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);		
		models.user.all({
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

	router.get('/statistics/german', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);		
		statistics.getGermanContractsByYearAndInterestRate(models, function(years) {
			//console.log("test: " + JSON.stringify(numbers);
			res.render('statistics/german', { title: 'Deutsche Direktkredite', years: years});
		});
	});	


	app.use('/', router);
};
