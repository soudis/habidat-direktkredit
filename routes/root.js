var security = require('../utils/security');
var moment = require("moment");
var passport = require('passport');
var router = require('express').Router();
var projects = require('../config/projects.json');
var config = require('../config/config.json');

module.exports = function(app){


	/* Welcome Site */
	router.get('/', function(req, res, next) {
		if (req.session.project) {
     		res.render('index', { title: 'habiDAT', message: req.flash('loginMessage') } );  	
     	} else {
     		res.redirect('/project');
     	}
	});


	/* Welcome Site */
	router.get('/project', function(req, res, next) {
     	res.render('select-project', { title: 'habiDAT - Projectauswahl',projects: projects} );  	
	});

		/* Welcome Site */
	router.get('/project/:project', function(req, res, next) {
		req.session.project = req.params.project;
     	res.redirect('/');
	});

	router.get('/admin', security.isLoggedInAdmin, function(req, res) {
		res.redirect('/user/list');
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	router.get('/logout', function(req, res) {
	    req.logout();
	    res.redirect('/');
	});

	//=====================================
	//LOGOUT ==============================
	//=====================================
	router.get('/admin-logout', function(req, res) {
	 req.logout();
	 res.redirect('/');
	});

	var loginStrategies = ['local-login-admin', 'local-login'];
	if (config.adminauth == 'ldap') {
		loginStrategies = ['ldap-login-admin', 'local-login-admin','local-login'];
	}
	
	router.post('/logon', passport.authenticate(loginStrategies, {
	    successReturnToOrRedirect : '/profile', // redirect to the secure profile section
	    failureRedirect : '/', // redirect back to the signup page if there is an error
	    failureFlash : true // allow flash messages
	}));


	app.use('/', router);
};