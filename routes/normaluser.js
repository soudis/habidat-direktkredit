/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const utils = require('../utils');
const fs = require('fs');
const numeral = require('numeral');
const format = require('../utils/format');
const router = require('express').Router();
const models  = require('../models');
const Op = require("sequelize").Op;

const intl = require('../utils/intl');

const multer = require('multer');

module.exports = function(app){

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	router.get('/profile', security.isLoggedIn, function(req, res, next) {
		if (req.user.dn || req.user.isAdmin()) {
			res.redirect(utils.generateUrl(req, '/admin'));
		} else {
			models.user.findByIdFetchFull(models, req.user.id)
				.then((user) => {
					res.render('profile', {
						user : user, // get the user out of session and pass to template
						title: "Direktkreditinfo",
						success: req.flash('success')
					});
				})
				.catch(error => next(error));
		}
	});

	router.get('/files', security.isLoggedIn, function(req, res, next) {
		models.file.findAll({
			where: {
				ref_table: {
			      [Op.like]: "infopack_%"
			    }
			}
		}).then(function(files) {
			groups = {
				balance: {
					title: "Jahresabschlüsse",
					files: []
				},
				infopack: {
					title: "Direktkreditinformationen",
					files: []
				},
				other: {
					title: "Sonstige Dateien",
					files: []
				}
			};
			files.map((file => {
				var group = file.ref_table.split("_")[1];
				file.group = group;
				if (groups[group]) {
					groups[group].files.push(file);
				}
			}));
			return models.user.findByIdFetchFull(models, req.user.id)
				.then(user => {
					res.render('files', { user:user, title: 'Dateien und Informationen zum Projekt', groups: groups });
				})

		})
		.catch(error => next(error));
	});


	router.post('/accountnotification', security.isLoggedIn, multer().none(),function(req, res, next) {
		models.user.findByIdFetchFull(models, req.user.id)
			.then(user => {

				data = user.getRow();
				data.user_contracts = user.contracts.map(contract => {
					var data = contract.getRow();
					Object.keys(data).forEach(key => {
						data[key] = data[key].value;
					})
					data.contract_transactions = contract.transactions.map(transaction => {
						var data = transaction.getRow();
						Object.keys(data).forEach(key => {
							data[key] = data[key].value;
						})
					})
					data.current_date = moment().format('DD.MM.YYYY');

				})

				Object.keys(data).forEach(key => {
					data[key] = data[key].value;
				})

				data.user_address = data.user_address.replace('</br>', "\n");

				data.current_date = moment().format('DD.MM.YYYY');
				data.year = req.body.year;

				var transactionList = user.getTransactionList(req.body.year);

				transactionList.sort(function(a,b) {
					if (a.contract_id > b.contract_id)
						return 1;
					else if (b.contract_id > a.contract_id)
						return -1;
					else {						
						if (a.date.isAfter(b.date, 'day'))
							return 1;
						else if (b.date.isAfter(a.date, 'day'))
							return -1;
						else {
							if (a.order > b.order)
								return 1;
							else if (a.order < b.order)
								return -1;
							else 
								return 0;
						}
					}
				});
				data.user_transactions_year = [];

				var interestTotal = 0, interestTotalPaid = 0, amountTotalEnd = 0, amountTotalBegin = 0, lastTransaction;
				transactionList.forEach(function(transaction) {
					if (transaction.type.startsWith("Zinsertrag")) {
						interestTotal = interestTotal + transaction.amount;
					}
					if (transaction.type.startsWith("Zinsauszahlung")) {
						interestTotalPaid -= transaction.amount;
					}			
					if (transaction.type.startsWith("Kontostand Jahresende")) {
						amountTotalEnd += transaction.amount;
					}	
					if (transaction.type.startsWith("Kontostand Jahresbeginn")) {
						amountTotalBegin += transaction.amount;
					}						
					data.user_transactions_year.push ({
						contract_id: transaction.contract_id,
						contract_interest_rate: format.formatPercent(transaction.interest_rate),
						contract_interest_payment_type: intl._t('interest_payment_type_' + transaction.interest_payment_type),
						contract_first_line: !lastTransaction || lastTransaction.contract_id !== transaction.contract_id,
						transaction_date: format.formatDate(transaction.date),
						transaction_amount: format.formatMoney(transaction.amount),
						transaction_type: transaction.type,

					});

					lastTransaction = transaction;

				});

				data.interest_total = format.formatMoney(interestTotal);
				data.interest_total_paid = format.formatMoney(interestTotalPaid);
				data.amount_total_end = format.formatMoney(amountTotalEnd);
				data.amount_total_begin = format.formatMoney(amountTotalBegin);

				var filename =  "Kontomitteilung " + user.id + " " + req.body.year;

			    return models.file.findOne({
						where: {
							ref_table: "template_account_notification"
						}
					})
			    	.then(template => {
						return utils.generateDocx(template.path, data)
							.then(result => utils.convertToPdf(result))
							.then(file => {
								res.setHeader('Content-Length', file.length);
								res.setHeader('Content-Type', 'application/pdf');
								res.setHeader('Content-Disposition', 'inline; filename="' + filename + '.pdf"');
								res.write(file, 'binary');
								res.end();
							})
					});

			})
			.catch(error => next(error));
	});

	app.use('/', router);
};
