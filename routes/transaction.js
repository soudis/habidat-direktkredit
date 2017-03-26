var security = require('../utils/security');
var moment = require("moment");
var router = require('express').Router();

module.exports = function(app){



	/* GET home page. */
	router.get('/transaction/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.transaction.find({
			where : {
				id: req.params.id
			}
		}).then(function(transaction) {
			models.contract.find({
				where:{
					id: transaction.contract_id
				}
			}).then(function(contract) {
				models.user.findByIdFetchFull(models, contract.user_id, function(user) {
					  res.render('user/show', { user:user, editTransaction:transaction, title: 'Zahlung bearbeiten'});
				});	
			});
		});	
	});

	/* GET home page. */
	router.get('/transaction/add/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
			models.contract.find({
				where:{
					id: req.params.id
				}
			}).then(function(contract) {
				models.user.findByIdFetchFull(models, contract.user_id, function(user) {
					  var addTransaction =  {contract_id : contract.id};
					  res.render('user/show', { user:user, addTransaction:addTransaction, title: 'Zahlung anlegen' });
				});	
			});
	});

	router.post('/transaction/add', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.transaction.create({
			transaction_date: moment(req.body.transaction_date, 'DD.MM.YYYY')+1000*60*60*24,
			amount: req.body.amount,
			type: req.body.type,
			contract_id: req.body.contract_id
		}).then(function(transaction) {
			res.redirect('/user/show/' + req.body.user_id);
		}).catch(function(err) {
			models.user.findByIdFetchFull(models,req.body.user_id,function(user) {
				res.render('user/show', { user:user, addTransaction:{contract_id: req.body.contract_id, amount: req.body.amount, type: req.body.type, transaction_date : req.body.transaction_date}, title: 'Zahlung anlegen', message: err.message });
			});	
		});
	});
	
	router.post('/transaction/edit', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.transaction.update({
			transaction_date: moment(req.body.transaction_date, 'DD.MM.YYYY')+1000*60*60*24,
			amount: req.body.amount,
			type: req.body.type
		}, {where:{id:req.body.id}}).then(function(transaction) {
			res.redirect('/user/show/' + req.body.user_id);
		}).catch(function(err) {
			models.user.findByIdFetchFull(models,req.body.user_id,function(user) {
				res.render('user/show', { user:user, editTransaction:{id: req.body.id, contract_id: req.body.contract_id, amount: req.body.amount, type: req.body.type, transaction_date : req.body.transaction_date}, title: 'Zahlung bearbeiten', message: err.message });
			});	
		});
	});


	router.get('/transaction/delete/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.transaction.find({
			where: {
				id: req.params.id
			}
		}).then(function(transaction) {
			  transaction.destroy();
			  res.redirect(security.redirectReload(req.headers.referer));
		});	
	});

	app.use('/', router);
};
