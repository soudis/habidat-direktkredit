var security = require('../utils/security');
var moment = require("moment");
var passport = require('passport');
var router = require('express').Router();
var projects = require('../config/projects.json');

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


	/* Admin Logon page */
	router.get('/admin-logon', function(req, res, next) {
		if (req.session.project) {
       	    res.render('admin/admin-logon', { title: 'habiDAT Login', message: req.flash('loginMessage') });
     	} else {
     		res.redirect('/project');
     	}	  
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
	
	router.post('/logon', passport.authenticate('local-login', {
	    successReturnToOrRedirect : '/profile', // redirect to the secure profile section
	    failureRedirect : '/', // redirect back to the signup page if there is an error
	    failureFlash : true // allow flash messages
	}));

	router.post('/admin-logon', passport.authenticate('local-login-admin', {
	    successReturnToOrRedirect : '/admin', // redirect to the secure profile section
	    failureRedirect : '/admin-logon', // redirect back to the signup page if there is an error
	    failureFlash : true // allow flash messages
	}));

	app.use('/', router);
};