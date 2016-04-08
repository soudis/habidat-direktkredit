var models  = require('../models');
var security = require('../utils/security');
var moment = require("moment");
var router = require('express').Router();
var url = require('url');

module.exports = function(app){

	router.get('/user/list', security.isLoggedInAdmin, function(req, res) {
		models.user.findFetchFull(models, ['administrator <> 1'], function(users) {
			res.render('user/list', {users: users, title: 'Direktkreditgeber*innen Liste'});
		});
	});

	router.get('/user/add', security.isLoggedInAdmin, function(req, res, next) {
	  res.render('user/add', { title: 'Neuer Direktkredit'});
	});

	router.get('/user/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id, function(user) {
			  res.render('user/edit', { user:user, title: 'Direktkreditgeber*in Bearbeiten'});
		});	
	});

	router.get('/user/show/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id, function(user) {
			  res.render('user/show', { user:user, title: 'Direktkreditgeber*in' });
		});	
	});

	router.post('/user/add', security.isLoggedInAdmin, function(req, res) {
		
		var length = 8,
	    charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
	    password = "";
		for (var i = 0, n = charset.length; i < length; ++i) {
			password += charset.charAt(Math.floor(Math.random() * n));
		}
		
		models.user.create({
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			street: req.body.street,
			zip: req.body.zip,
			place: req.body.place,
			telno: req.body.telno,
			email: req.body.email,
			IBAN: req.body.IBAN,
			BIC: req.body.BIC,
	        logon_id: Math.abs(Math.random() * 100000000),
	        password: password
			
		}).then(function(user) {
			res.redirect('/user/show/' + user.id);
		});	
	});

	router.post('/user/edit', security.isLoggedInAdmin, function(req, res) {
		models.user.update({
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			street: req.body.street,
			zip: req.body.zip,
			place: req.body.place,
			telno: req.body.telno,
			email: req.body.email,
			IBAN: req.body.IBAN,
			BIC: req.body.BIC	
		}, {where:{id:req.body.id}}).then(function(user) {
			res.redirect('/user/show/' + req.body.id);
		});	
	});

	app.use('/', router);

};
