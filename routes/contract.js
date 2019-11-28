var security = require('../utils/security');
var moment = require("moment");
var router = require('express').Router();

module.exports = function(app){


	/* Add contract */
	router.get('/contract/add/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id,function(user){
			  res.render('contract/add', { user:user, title: 'Direktkredit Einfügen' });
		});	
	});

	/* Edit contract */
	router.get('/contract/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.contract.findOne({
			where : {
				id: req.params.id
			}
		}).then(function(contract) {
			models.user.findByIdFetchFull(models, contract.user_id,function(user){
				  res.render('contract/edit', { user:user, editContract:contract, title: 'Direktkredit bearbeiten' });
			});	
		});
	});

	router.post('/contract/add', security.isLoggedInAdmin, function(req, res) {		
		var models  = require('../models')(req.session.project);
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
		models.contract.create({
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
		}).then(function(user) {
			res.redirect('/user/show/' + req.body.user_id);
		});	
	});
	
	router.post('/contract/edit', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
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
		models.contract.update({
			sign_date: moment(req.body.sign_date, 'DD.MM.YYYY'),
			termination_date: termination_date,
			termination_type: req.body.termination_type,
			termination_period: termination_period,
			termination_period_type: termination_period_type,
			amount: req.body.amount,
			interest_rate: req.body.interest_rate,
			status: req.body.status,
			notes: req.body.notes
		}, {where:{id:req.body.id}}).then(function(contract) {
			res.redirect('/user/show/' + req.body.user_id);
		});	
	});

	router.get('/contract/delete/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.contract.destroy({
			where: {
				id: req.params.id
			}
		}).then(function(deleted) {
			if(deleted > 0) {
			 	res.redirect(security.redirectReload(security.getPrevURL(req)));
			} else {
				req.flash('error', 'Vertrag konnte nicht gelöscht werden, überprüfe bitte ob noch Zahlungen bestehen');
				res.redirect(security.redirectReload(security.getPrevURL(req)));
			}
		}).catch(function(error) {
			req.flash('error', 'Vertrag konnte nicht gelöscht werden, überprüfe bitte ob noch Zahlungen bestehen');
			res.redirect(security.redirectReload(security.getPrevURL(req)));
		});  
	});
	
	app.use('/', router);
};
