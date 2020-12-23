/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const router = require('express').Router();
const utils = require('../utils');
const models  = require('../models');
const email = require('../utils/email');
const settings = require('../utils/settings');
const contracttable = require('../utils/contracttable');
const multer = require('multer');
const Op = require("sequelize").Op;

module.exports = function(app){

	const columnsVisible = ['contract_sign_date', 'user_name', 'user_iban', 'contract_status', 'contract_amount', 'contract_amount_to_date', 'contract_interest_of_year', 'contract_interest_payment_type'];

	router.get('/process/interestpayment/:year', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, {}, (user, contract) => {
				return (contract.interest_payment_type === 'yearly' || !contract.interest_payment_type && settings.project.get('defaults.interest_payment_type') === 'yearly') && contract.getInterestOfYear(req.params.year) > 0;
			})
			.then(users => {
				return models.transaction.min('transaction_date')
					.then(minTransactionDate => {
						var years = [];
						for (var year = parseInt(moment(minTransactionDate).year()); year <= parseInt(moment().year()); year ++) {
							years.push(year.toString());
						}
						return utils.render(req, res, 'process/interestpayment', {success: req.flash('success'), years: years, year: req.params.year, contracts: contracttable.generateContractTable(req, res, users, undefined, req.params.year).setColumnsVisible(columnsVisible)}, 'Jährliche Zinsauszahlung');
					})
			})
			.catch(error => next(error));
	});

	router.get('/process/startinterestpayment/:year/:contracts', security.isLoggedInAdmin, function(req, res, next) {
	  	if (!req.params.contracts || req.params.contracts.split(',').length === 0) {
	  		next(new Error("Keine Verträge ausgewählt"));
	  	}
		models.user.findFetchFull(models, {}, (user, contract) => {
				return req.params.contracts.split(',').includes(contract.id.toString());
			})
			.then(users => {
				var interests = 0;
				users.forEach(user => {
					user.contracts.forEach(contract => {
						interests += Math.round(contract.getInterestOfYear(req.params.year)*100)/100;
					})
				});
	  			res.render('process/startinterestpayment', {contracts: req.params.contracts.split(','), year: req.params.year, interests: interests});
	  		})
	  		.catch(error => next(error));
	});

	router.post('/process/startinterestpayment', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		models.user.findFetchFull(models, { }, (user, contract) => {
				return req.body.contracts.split(',').includes(contract.id.toString());
			})
			.then(users => {
				var create = [];
				users.forEach(user => {
					user.contracts.forEach(contract => {
						var transaction = {
								transaction_date: moment(req.body.year).endOf('year'),
								amount: -Math.round(contract.getInterestOfYear(req.body.year)*100)/100,
								type: 'interestpayment',
								contract_id: contract.id,
								payment_type: 'bank'
							}
						create.push(models.transaction.create(transaction, { trackOptions: utils.getTrackOptions(req.user, true) }))
					})
				});
				return Promise.all(create)
					.then(() => {
						res.send({message: create.length + ' Zahlungen angelegt.'});
					})
	  		})
	  		.catch(error => next(error));
	});

	app.use('/', router);
};
