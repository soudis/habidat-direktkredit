/* jshint esversion: 8 */
const security = require('../utils/security');
const format = require('../utils/format');
const moment = require("moment");
const router = require('express').Router();
const url = require('url');
const utils = require('../utils');
const Promise = require('bluebird');
const Op = require("sequelize").Op;
const models  = require('../models');
const multer = require('multer');
const exceljs = require('exceljs');
const contracttable = require('../utils/contracttable');

module.exports = function(app){

	function renderUser(req, res, models, data) {
		return Promise.join(models.file.getUserTemplates(), models.file.getContractTemplates(),
			(templates_user, templates_contract) => {
				data.templates_user = templates_user;
				data.templates_contract = templates_contract;
				utils.render(req, res, 'user/show', data);
			});
	}

	const columnsVisible = ['contract_sign_date', 'user_name', 'contract_status', 'contract_amount', "contract_deposit", "contract_withdrawal", 'contract_amount_to_date'];

	router.get('/user/list/cancelled', security.isLoggedInAdmin, function(req, res, next) {
		models.user.cancelledAndNotRepaid(models, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', {contracts: contracttable.generateContractTable(req, res, users).setColumnsVisible((columnsVisible.join(',')+',contract_termination_type,contract_termination_date,contract_payback_date').split(','))}, 'Gekündigte, nicht ausgezahlte Kredite'))
			.catch(error => next(error));
	});

	router.get('/user/list', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', {success: req.flash('success'), contracts: contracttable.generateContractTable(req, res, users).setColumnsVisible(columnsVisible)}, 'Kreditliste'))
			.catch(error => next(error));
	});

	router.post('/user/saveview', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);
				} else {
					views = [];
				}
				views.push(req.body.view);
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save({trackOptions: utils.getTrackOptions(req.user, false)}).then(() => {
					res.send({id: views.length - 1});
				});
			})
			.catch(error => next);
	});

	router.post('/user/saveview/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);
				} else {
					views = [];
				}
				views.splice(req.params.id, 1, req.body.view);
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save({trackOptions: utils.getTrackOptions(req.user, false)}).then(() => {
					res.send({id: req.params.id});
				});
			})
			.catch(error => next);
	});

	router.get('/user/deleteview/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);
				} else {
					views = [];
				}
				views.splice(req.params.id, 1);
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save({trackOptions: utils.getTrackOptions(req.user, false)}).then(() => {
					res.send({id: req.body.id});
				});
			})
			.catch(error => next);
	});

	router.get('/user/add', security.isLoggedInAdmin, function(req, res, next) {
	  res.render('user/add');
	});

	router.get('/user/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user => utils.render(req, res, 'user/edit', { user:user}, 'Direktkreditgeber*in Bearbeiten'))
			.catch(error => next(error));
	});

	router.get('/user/show/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user =>  renderUser(req, res, models, { user:user, title: 'Direktkreditgeber*in' }))
			.catch(error => next(error));
	});

	router.post('/user/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		Promise.resolve()
			.then(() => {
				if (!req.body.email || req.body.email === '') {
					if (!req.body.ignore_warning) {
						throw new utils.Warning('Ohne E-Mailadresse kann sich der*die Kreditgeber*in nicht einloggen');
					} else {
						return;
					}
				} else {
					return models.user.emailAddressTaken(req.body.email)
						.then(taken => {
							if (taken) {
								throw "E-Mailadresse wird bereits verwendet";
							} else {
								return ;
							}
						})
				}
			})
			.then(() => {
				var length = 8,
			    charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			    password = "";
				for (var i = 0, n = charset.length; i < length; ++i) {
					password += charset.charAt(Math.floor(Math.random() * n));
				}
				return models.user.create({
					id: req.body.id,
					first_name: req.body.first_name,
					last_name: req.body.last_name,
					street: req.body.street,
					zip: req.body.zip,
					place: req.body.place,
					telno: req.body.telno,
					email: req.body.email,
					country: req.body.country,
					IBAN: req.body.IBAN,
					BIC: req.body.BIC,
					logon_id: Math.abs(Math.random() * 100000000),
					password: password,
					administrator:false,
					ldap: false,
					relationship: req.body.relationship
				}, { trackOptions: utils.getTrackOptions(req.user, true) });
			})
			.then(user => res.send({redirect : utils.generateUrl(req, '/user/show/' + user.id)}))
			.catch(error => next(error));
	});

	router.post('/user/edit', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		console.log(JSON.stringify(req.user));
		models.user.update({
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				street: req.body.street,
				zip: req.body.zip,
				place: req.body.place,
				country: req.body.country,
				telno: req.body.telno,
				email: req.body.email,
				IBAN: req.body.IBAN,
				BIC: req.body.BIC,
				relationship: req.body.relationship
			}, {where: { id:req.body.id }, trackOptions: utils.getTrackOptions(req.user, true) })
			.then(() => res.send({redirect: 'reload'}))
			.catch(error => next(error));
	});

	router.get('/user/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.destroy({ where: { id: req.params.id }, trackOptions: utils.getTrackOptions(req.user, true)})
			.then(function(deleted) {
				if(deleted > 0) {
				 	res.json({redirect: utils.generateUrl(req, '/user/list')});
				} else {
					res.json({error: 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen'});
				}
			}).catch(function(error) {
				res.json({error: 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen'});
			});
	});

	const generateDatasheetRow = function(fields, contractTableRow) {
		var row = [];
		contractTableColumns.forEach((column, index) => {
			if (fields === 'all' || fields.includes(column.id)) {
				console.log(contractTableRow[index].valueRaw);
				row.push(contractTableRow[index].valueRaw);
			}
		});
		return row;
	};


	router.get('/user/loginas/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.params.id)
			.then(user => {
				req.logIn(user, error => {
					if (error) {
						next(error);
					} else {
						res.redirect(utils.generateUrl(req, '/'));
					}
				});
			})
			.catch(error => next);
	});

	router.post('/user/export', security.isLoggedInAdmin, function(req, res, next) {
		var userIds = req.body.users.split(',');
		var fields = req.body.fields.split(',');
		var contractIds = req.body.contracts.split(',');
		var interestYear = req.body.interest_year ? req.body.interest_year : moment().subtract(1,'years').year();


		var workbook = new exceljs.Workbook();
		workbook.creator = 'DK Plattform';
		workbook.created = new Date();

		var dataWorksheet = workbook.addWorksheet('Daten');

		dataWorkSheetColumns = [];
		contracttable.getContractTableColumns(interestYear).forEach((column, index) => {
			if (fields === 'all' || fields.includes(column.id)) {
				dataWorkSheetColumns.push({header: column.label, key: column.id, width: 20});
			}
		});
		dataWorksheet.columns = dataWorkSheetColumns;
		models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
			.then(users => {
				users.forEach(user => {
					if (userIds.includes(user.id.toString())) {
						console.log('user acc');
						var contractsCount = 0;
						if (user.contracts) {
							user.contracts.forEach(contract => {
								if (contractIds.includes(contract.id.toString())) {
									console.log('contract acc');
									contractsCount ++;
									dataWorksheet.addRow(generateDatasheetRow(fields, contracttable.contractTableRow(user, contract, undefined, interestYear)));
								}
							});
						}

						if (contractsCount === 0) {
							dataWorksheet.addRow(generateDatasheetRow(fields, contracttable.contractTableRow(user, undefined, undefined, interestYear)));
						}
					}
				});

				res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				res.setHeader('Content-Disposition', 'attachment; filename=direktkredite_' + moment().format('YYYYMMDDHHmmss') + ".xlsx");
				return workbook.xlsx.write(res)
					.then(() => res.end());

			});

	});

	app.use('/', router);

};
