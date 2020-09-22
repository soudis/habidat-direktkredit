/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const passport = require('passport');
const router = require('express').Router();
const settings = require('../utils/settings');
const models  = require('../models');
const utils = require('../utils');
const email = require('../utils/email');
const bcrypt = require('bcrypt');

module.exports = function(app){

	router.get('/projectconfig', function(req, res, next) {
		var project = settings.project.get(undefined);
		res.json(project);
	});

	/* Welcome Site */
	router.get('/', security.isLoggedInAdmin, function(req, res, next) {
		res.redirect(utils.generateUrl(req, '/user/list'));
	});

	/* Welcome Site */
	router.get('/login', function(req, res, next) {
		res.render('index', { title: 'Login', error: req.flash('loginMessage'), success: req.flash('success') } );
	});

	router.get('/getpassword', function(req, res, next) {
		res.render('getpassword', { title: 'Passwort rücksetzen', error: req.flash('error') } );
	});

	router.get('/setpassword/user', security.isLoggedIn, function(req, res, next) {
   		res.render('setpassword', { user: req.user, usertype: 'user', title: 'Passwort ändern', error: req.flash('error') } );
	});

	router.get('/setpassword/admin', security.isLoggedInAdmin, function(req, res, next) {
   		res.render('setpassword', { user: req.user, usertype: 'admin', title: 'Passwort ändern', error: req.flash('error') } );
	});

	router.get('/getpassword/:token', function(req, res, next) {
		models.admin.findByToken(req.params.token)
		    .catch(error => {
		    	// if no admin account was found by token try user accounts
		    	return models.user.findByToken(req.params.token);
		    })
			.then(user => {
				res.render('setpassword', {token: req.params.token, usertype: (user.isAdmin()?'admin':'user'), user: user, title: 'Passwort setzen', error: req.flash('error')});
			})
			.catch(error => {
				req.flash('error', error);
				res.redirect(utils.generateUrl(req, '/getpassword'));
			});
	});

	router.post('/setpassword', function(req, res, next) {
		if (!req.body.password || req.body.password === '') {
			req.flash('error', 'Passwort darf nicht leer sein!');
			res.redirect(utils.generateUrl(req, '/getpassword/' + req.body.token));
		} else if(req.body.password !== req.body.passwordRepeat) {
			req.flash('error', 'Passwörter müssen übereinstimmen');
			res.redirect(utils.generateUrl(req, '/getpassword/' + req.body.token));
		} else {
			Promise.resolve()
				.then(() => {
					var salt = bcrypt.genSaltSync(10);
					var passwordHashed = bcrypt.hashSync(req.body.password, salt);
					if (req.body.usertype === 'admin') {
						console.log('update admin pwd');
						return models.admin.update({ passwordHashed: passwordHashed, passwordResetToken: null, passwordResetExpires: null }, {where: { id:req.body.id }, trackOptions: utils.getTrackOptions(req.user, true) });
					} else {
						console.log('update user pwd');
						return models.user.update({ passwordHashed: passwordHashed, passwordResetToken: null, passwordResetExpires: null }, {where: { id:req.body.id }, trackOptions: utils.getTrackOptions(req.user, true) });
					}
				})
				.then(() => {
					if (req.body.token) {
						req.flash('success', 'Dein Passwort wurde gesetzt, logge dich jetzt ein');
					} else {
						req.flash('success', 'Dein Passwort wurde geändert');
					}
					res.redirect(utils.generateUrl(req, '/'));
				});
		}

	});

	router.post('/getpassword', function(req, res, next) {

		models.admin.findOne({where: { email: req.body.email }})
			.then(user => {
				if (!user) {
					// if no admin account was found by token try user accounts
					return models.user.findOne({where: { email: req.body.email }})
				} else {
					return user;
				}
			})
			.then(user => {
				if (!user) {
					return;
				} else {
					console.log('user found: ', user.isAdmin());
					user.setPasswordResetToken();
					return user.save({trackOptions: utils.getTrackOptions(req.user, false)})
						.then(user => email.sendPasswordMail(req,res,user));
				}
			})
			.then(() => {
				req.flash('success', 'Falls dein Account gefunden wurde, hast du ein E-Mail mit einem Link bekommen. Bitte sieh auch in deinem Spam-Ordner nach.');
				res.redirect(utils.generateUrl(req, '/'));
			})
			.catch(error => {
				req.flash('error', 'E-Mail konnte nicht versandt werden: ' + error);
				res.redirect(utils.generateUrl(req, '/getpassword'));
			});
	});

/*
	router.get('/project', function(req, res, next) {
     	res.render('select-project', { title: 'habiDAT - Projectauswahl',projects: projects} );
	});
*/
		/* Welcome Site */
/*	router.get('/project/:project', function(req, res, next) {
		req.session.project = req.params.project;
		req.session.projectConfig = projects[req.params.project];
		req.logout();
     	res.redirect('/');
	});*/

	router.get('/admin', security.isLoggedInAdmin, function(req, res) {
		res.redirect(utils.generateUrl(req, '/user/list'));
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect(utils.generateUrl(req, '/'));
	});

	//=====================================
	//LOGOUT ==============================
	//=====================================
	router.get('/admin-logout', function(req, res) {
		req.logout();
		res.redirect(utils.generateUrl(req, '/'));
	});

	var loginStrategies = ['local-login-admin', 'local-login'];
	if (settings.config.get('auth.admin.method') == 'ldap') {
		loginStrategies = ['ldap-login-admin', 'local-login-admin','local-login'];
	}

	router.post('/login', function(req, res, next) {
	  	passport.authenticate(loginStrategies, function(err, user, info) {
	    	if (err) {
	    		return next(err);
	    	}
	    	if (!user) {
	    		return res.redirect(utils.generateUrl(req, '/'));
	    	}
	    	req.logIn(user, function(err) {
	      		if (err) {
	      			return next(err);
	      		}
	      		if (req.session.returnTo) {
	      			return res.redirect(req.session.returnTo);
	      		} else {
	      			return res.redirect(utils.generateUrl(req, '/profile'));
	      		}
	    	});
	  	})(req, res, next);
	});

	app.use('/', router);
};