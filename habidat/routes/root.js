var models  = require('../models');
var security = require('../utils/security');
var moment = require("moment");
var passport = require('passport');
var router = require('express').Router();

module.exports = function(app){


	/* Welcome Site */
	router.get('/', function(req, res, next) {
	  res.render('index', { title: 'habiDAT' } );
	});

	/* Admin Logon page */
	router.get('/admin-logon', function(req, res, next) {
	  res.render('admin/admin-logon', { title: 'habiDAT Login' });
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
	 res.redirect('/admin');
	});
	
	router.post('/logon', passport.authenticate('local-login', {
	    successRedirect : '/profile', // redirect to the secure profile section
	    failureRedirect : '/', // redirect back to the signup page if there is an error
	    failureFlash : true // allow flash messages
	}));

	router.post('/admin-logon', passport.authenticate('local-login-admin', {
	    successRedirect : '/admin', // redirect to the secure profile section
	    failureRedirect : '/admin-logon', // redirect back to the signup page if there is an error
	    failureFlash : true // allow flash messages
	}));

	app.use('/', router);
};