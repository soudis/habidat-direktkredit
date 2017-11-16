var security = require('../utils/security');
var moment = require("moment");
var router = require('express').Router();
var url = require('url');

module.exports = function(app){

	router.get('/user/list/:mode', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		if (req.params.mode === 'expire') {
			models.user.aboutToExpire(models, ['administrator <> 1'], 90, function(users) {
				res.render('user/list', {users: users, title: 'Direktkreditgeber*innen Liste (abgelaufene Kredite'});
			});
		} else if (req.params.mode === 'cancelled') {
			models.user.cancelledAndNotRepaid(models, ['administrator <> 1'], function(users) {
				res.render('user/list', {users: users, title: 'Direktkreditgeber*innen Liste (gekündigte, offene Kredite)'});
			});			
		}
	});
	
	router.get('/user/list', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.user.findFetchFull(models, ['administrator <> 1'], function(users) {
			res.render('user/list', {users: users, title: 'Direktkreditgeber*innen Liste'});
		});

	});

	router.get('/user/add', security.isLoggedInAdmin, function(req, res, next) {
	  res.render('user/add', { title: 'Neuer Direktkredit'});
	});

	router.get('/user/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id, function(user) {
			  res.render('user/edit', { user:user, title: 'Direktkreditgeber*in Bearbeiten'});
		});	
	});

	router.get('/user/show/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id, function(user) {
			  res.render('user/show', { user:user, title: 'Direktkreditgeber*in', message: req.flash('error') });
		});	
	});

	router.post('/user/add', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
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
	        password: password,
	        relationship: req.body.relationship
			
		}).then(function(user) {
			res.redirect('/user/show/' + user.id);
		});	
	});

	router.post('/user/edit', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.user.update({
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			street: req.body.street,
			zip: req.body.zip,
			place: req.body.place,
			telno: req.body.telno,
			email: req.body.email,
			IBAN: req.body.IBAN,
			BIC: req.body.BIC,
			relationship: req.body.relationship
		}, {where:{id:req.body.id}}).then(function(user) {
			res.redirect('/user/show/' + req.body.id);
		});	
	});

	router.get('/user/delete/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.user.destroy({
			where: {
				id: req.params.id
			}
		}).then(function(deleted) {
			if(deleted > 0) {
			 	res.redirect('/user/list');
			} else {
				req.flash('error', 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen');
				res.redirect('/user/show/' + req.params.id);
			}
		}).catch(function(error) {
			req.flash('error', 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen');
			res.redirect('/user/show/' + req.params.id);
		});  
	});

	app.use('/', router);

};
