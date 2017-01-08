var models  = require('../models');
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
		statistics.getNumbers(function(numbers) {
			console.log("test: " + numbers.amount);
			res.render('statistics/numbers', { title: 'Zahlen, Daten, Fakten', "numbers": numbers});
		});

	});
	
	router.post('/statistics/transactionList', security.isLoggedInAdmin, function(req, res) {
		
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

			res.setHeader('Content-Length', file.length);
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'inline; filename=Jahresliste_'+ req.body.year +'.csv');
			res.write(file);
			res.end();

		});	
	});

	app.use('/', router);
};