/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const passport = require('passport');
const router = require('express').Router();
const settings = require('../utils/settings');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const models  = require('../models');
const utils = require('../utils');

module.exports = function(app){


	/* Welcome Site */
	router.get('/', security.isLoggedInAdmin, function(req, res, next) {
		res.redirect('/user/list');
	});

	/* Welcome Site */
	router.get('/login', function(req, res, next) {
		res.render('index', { title: 'Login', error: req.flash('loginMessage'), success: req.flash('success') } );
	});

	router.get('/getpassword', function(req, res, next) {
		res.render('getpassword', { title: 'Passwort setzen', error: req.flash('error') } );
	});

	router.get('/setpassword', security.isLoggedIn, function(req, res, next) {
   		res.render('setpassword', { user: req.user, title: 'Passwort ändern', error: req.flash('error') } );
	});


	router.get('/getpassword/:token', function(req, res, next) {
		models.user.findByToken(req.params.token)
			.then(user => {
				res.render('setpassword', {token: req.params.token, user: user, title: 'Passwort setzen', error: req.flash('error')});
			})
			.catch(error => {
				req.flash('error', error);
				res.redirect('/getpassword');
			});
	});

	router.post('/setpassword', function(req, res, next) {
		if (!req.body.password || req.body.password === '') {
			req.flash('error', 'Passwort darf nicht leer sein!');
			res.redirect('/getpassword/' + req.body.token);
		} else if(req.body.password !== req.body.passwordRepeat) {
			req.flash('error', 'Passwörter müssen übereinstimmen');
			res.redirect('/getpassword/' + req.body.token);
		} else {
			models.user.update({ password: req.body.password, passwordHashed: req.body.password, passwordResetToken: null, passwordResetExpires: null }, {where: { id:req.body.id } })
				.then(() => {
					if (req.body.token) {
						req.flash('success', 'Dein Passwort wurde gesetzt, logge dich jetzt ein');
					} else {
						req.flash('success', 'Dein Passwort wurde geändert');
					}
					res.redirect('/');
				});
		}

	});

	router.post('/getpassword', function(req, res, next) {

		models.user.findOne({where: { email: req.body.email }})
			.then(user => {
				if (!user) {
					return;
				} else {
					user.passwordResetToken = crypto.randomBytes(16).toString('hex');
					user.passwordResetExpires = Date.now() + 3600000 * 3; // 3 hours
					return user.save()
						.then(user => {
							return utils.renderToText(req, res, 'email/setpassword', {link: 'https://'+req.headers.host+'/getpassword/'+user.passwordResetToken});
						})
						.then(emailBody => {
							var transporter = nodemailer.createTransport({
						      service: 'SendGrid',
						      auth: {
						        user: process.env.SENDGRID_USER,
						        pass: process.env.SENDGRID_PASSWORD
						      }
						    });
						    const mailOptions = {
							    to: user.email,
							    from: 'no-reply@'+req.headers.host,
							    subject: 'Setze dein Passwort für die ' + settings.project.get('projectname') + ' Direktkreditplattform',
							    html: emailBody
							};
							return transporter.sendMail(mailOptions);
						});
				}
			})
			.then(() => {
				req.flash('success', 'Falls dein Account gefunden wurde, hast du ein E-Mail mit einem Link bekommen');
				res.redirect('/');
			})
			.catch(error => {
				req.flash('error', 'E-Mail konnte nicht versandt werden: ' + error);
				res.redirect('/getpassword');
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
	if (settings.config.get('auth.admin.method') == 'ldap') {
		loginStrategies = ['ldap-login-admin', 'local-login-admin','local-login'];
	}

	router.post('/logon', passport.authenticate(loginStrategies, {
		successReturnToOrRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	app.use('/', router);
};