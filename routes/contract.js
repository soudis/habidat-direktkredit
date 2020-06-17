/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const utils = require("../utils");
const router = require('express').Router();
const models  = require('../models');
const _t = require('../utils/intl')._t;
const multer = require('multer');

module.exports = function(app){


	/* Add contract */
	router.get('/contract/add/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user => utils.render(req, res, 'contract/add', { user:user }))
			.catch(error => next(error));
	});

	/* Edit contract */
	router.get('/contract/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.contract.findByPk(req.params.id)
			.then(contract => {
				return models.user.findByIdFetchFull(models, contract.user_id)
					.then(user => utils.render(req, res, 'contract/edit', { user:user, editContract:contract }));
			})
			.catch(error => next(error));
	});

	/* Edit contract */
	router.get('/contract/amount_to_date/:contract_id/:transaction_id/:date', security.isLoggedInAdmin, function(req, res, next) {
		models.contract.findByIdFetchFull(models, req.params.contract_id)
			.then(contract => res.json({amountToDate: contract.getAmountToDate(moment(req.params.date, 'DD.MM.YYYY'), req.params.transaction_id)}))
			.catch(error => res.status(500).json({error: error}));
	});

	router.post('/contract/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
		Promise.resolve()
			.then(() => {
				var termination_date = null;
				if (req.body.termination_type == "T") {
					termination_date = req.body.termination_date_T==""?null:moment(req.body.termination_date_T);
				} else if (req.body.termination_type == "D") {
					termination_date = req.body.termination_date_D==""?null:moment(req.body.termination_date_D);
				}
				var termination_period_type = null, termination_period = null;
				if (req.body.termination_type == "T") {
					termination_period_type = req.body.termination_period_type_T;
					termination_period = req.body.termination_period_T;
				} else if (req.body.termination_type == "P") {
					termination_period_type = req.body.termination_period_type_P;
					termination_period = req.body.termination_period_P;
				}
				return models.contract.create({
					id: req.body.id,
					sign_date: moment(req.body.sign_date),
					termination_date: termination_date,
					termination_type: req.body.termination_type,
					termination_period: termination_period,
					termination_period_type: termination_period_type,
					amount: req.body.amount,
					interest_rate: req.body.interest_rate,
					user_id: req.body.user_id,
					status: req.body.status,
					notes: req.body.notes
				}, { trackOptions: utils.getTrackOptions(req.user, true) });
			})
			.then(contract => models.contract.findOne({ where : { id: contract.id }, include: [{model: models.transaction, as: "transactions"}]}))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}));
			})
			.catch(error => next(error));
	});

	router.post('/contract/edit', security.isLoggedInAdmin, multer().none(), function(req, res, next) {

		return Promise.resolve()
			.then(() => {
				var termination_date = null;
				if (req.body.termination_type == "T") {
					termination_date = req.body.termination_date_T==""?null:moment(req.body.termination_date_T).format('YYYY-MM-DD');
				} else if (req.body.termination_type == "D") {
					termination_date = req.body.termination_date_D==""?null:moment(req.body.termination_date_D).format('YYYY-MM-DD');
				}
				var termination_period_type = null, termination_period = null;
				if (req.body.termination_type == "T") {
					termination_period_type = req.body.termination_period_type_T;
					termination_period = req.body.termination_period_T;
				} else if (req.body.termination_type == "P") {
					termination_period_type = req.body.termination_period_type_P;
					termination_period = req.body.termination_period_P;
				}
				return models.contract.update({
					sign_date: moment(req.body.sign_date).toDate(),
					termination_date: termination_date,
					termination_type: req.body.termination_type,
					termination_period: parseFloat(termination_period),
					termination_period_type: termination_period_type,
					amount: parseFloat(req.body.amount),
					interest_rate: parseFloat(req.body.interest_rate),
					status: req.body.status,
					notes: req.body.notes
				}, {where:{id:req.body.id}, trackOptions: utils.getTrackOptions(req.user, true)});
			})

			.then(() => models.contract.findByIdFetchFull(models, req.body.id))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}));
			})
			.catch(error => next(error));
	});

	router.get('/contract/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.contract.destroy({ where: { id: req.params.id }, trackOptions: utils.getTrackOptions(req.user, true) })
			.then(deleted => {
				if(deleted > 0) {
					res.json({});
				} else {
					res.json({'error': 'Vertrag konnte nicht gelöscht werden, überprüfe bitte ob noch Zahlungen bestehen'});
				}
			}).catch(error => {
				res.status(500).json({error: error});
			});
	});

	app.use('/', router);
};
