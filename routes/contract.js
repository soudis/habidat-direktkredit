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
		models.contract.find({
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
		models.contract.create({
			sign_date: moment(req.body.sign_date, 'DD.MM.YYYY')+1000*60*60*24,
			termination_date: req.body.termination_date===""?null:moment(req.body.termination_date, "DD.MM.YYYY")+1000*60*60*24,
			amount: req.body.amount,
			interest_rate: req.body.interest_rate,
			period: req.body.period,	
			user_id: req.body.id,
			status: req.body.status,
			notes: req.body.notes
		}).then(function(user) {
			res.redirect('/user/show/' + req.body.id);
		});	
	});
	
	router.post('/contract/edit', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.contract.update({
			sign_date: moment(req.body.sign_date, 'DD.MM.YYYY')+1000*60*60*24,
			termination_date: req.body.termination_date===""?null:moment(req.body.termination_date, "DD.MM.YYYY")+1000*60*60*24,
			amount: req.body.amount,
			interest_rate: req.body.interest_rate,
			period: req.body.period,	
			status: req.body.status,
			notes: req.body.notes
		}, {where:{id:req.body.id}}).then(function(contract) {
			res.redirect('/user/show/' + req.body.user_id);
		});	
	});

	router.get('/contract/delete/:id', security.isLoggedInAdmin, function(req, res) {		
		var models  = require('../models')(req.session.project);
		models.contract.find({
			where: {
				id: req.params.id
			}, 
			include:{ 
				model: models.transaction, 
				as: 'transactions'
			}
		}).then(function(contract) {
			  contract.destroy();
			  res.redirect(security.redirectReload(req.headers.referer));
		});	
	});
	
	app.use('/', router);
};
