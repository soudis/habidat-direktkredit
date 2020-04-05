var security = require('../utils/security');
var moment = require("moment");
var utils = require("../utils");
var router = require('express').Router();


module.exports = function(app){


	/* Add contract */
	router.get('/contract/add/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user => utils.render(req, res, 'contract/add', { user:user }))
			.catch(error => next(error));
	});

	/* Edit contract */
	router.get('/contract/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.contract.findByPk(req.params.id)
			.then(contract => {
				return models.user.findByIdFetchFull(models, contract.user_id)
					.then(user => utils.render(req, res, 'contract/edit', { user:user, editContract:contract }));
			})
			.catch(error => next(error));
	});

	/* Edit contract */
	router.get('/contract/amount_to_date/:contract_id/:transaction_id/:date', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.contract.findByIdFetchFull(models, req.params.contract_id)
			.then(contract => res.json({amountToDate: contract.getAmountToDate(req.session.project, moment(req.params.date, 'DD.MM.YYYY'), req.params.transaction_id)}))
			.catch(error => res.status(500).json({error: error}));
	});	

	router.post('/contract/add', security.isLoggedInAdmin, function(req, res, next) {		
		var models  = require('../models')(req.session.project);
		Promise.resolve()
			.then(() => {
				var termination_date = null;
				if (req.body.termination_type == "T") {
					termination_date = req.body.termination_date_T==""?null:moment(req.body.termination_date_T, "DD.MM.YYYY");
				} else if (req.body.termination_type == "D") {
					termination_date = req.body.termination_date_D==""?null:moment(req.body.termination_date_D, "DD.MM.YYYY");
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
					sign_date: moment(req.body.sign_date, 'DD.MM.YYYY'),
					termination_date: termination_date,
					termination_type: req.body.termination_type,
					termination_period: termination_period,
					termination_period_type: termination_period_type,
					amount: req.body.amount,
					interest_rate: req.body.interest_rate,
					user_id: req.body.user_id,
					status: req.body.status,
					notes: req.body.notes
				})
			})
			.then(contract => models.contract.findOne({ where : { id: contract.id }, include: [{model: models.transaction, as: "transactions"}]}))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}))
			})
			.catch(error => next(error));
	});
	
	router.post('/contract/edit', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		return Promise.resolve()
			.then(() => {
				var termination_date = null;
				if (req.body.termination_type == "T") {
					termination_date = req.body.termination_date_T==""?null:moment(req.body.termination_date_T, "DD.MM.YYYY");
				} else if (req.body.termination_type == "D") {
					termination_date = req.body.termination_date_D==""?null:moment(req.body.termination_date_D, "DD.MM.YYYY");
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
					sign_date: moment(req.body.sign_date, 'DD.MM.YYYY'),
					termination_date: termination_date,
					termination_type: req.body.termination_type,
					termination_period: termination_period,
					termination_period_type: termination_period_type,
					amount: req.body.amount,
					interest_rate: req.body.interest_rate,
					status: req.body.status,
					notes: req.body.notes
				}, {where:{id:req.body.id}})
			})
		
			.then(() => models.contract.findByIdFetchFull(models, req.body.id))
			.then(contract => {
				return models.file.getContractTemplates()
					.then(templates => utils.render(req, res, 'contract/show', {templates_contract: templates, contract:contract}))				
			})
			.catch(error => next(error));
	});

	router.get('/contract/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		
		var models  = require('../models')(req.session.project);
		models.contract.destroy({ where: { id: req.params.id } })
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
