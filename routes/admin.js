/* jshint esversion: 8 */
const security = require('../utils/security');
const router = require('express').Router();
const utils = require('../utils');
const Promise = require('bluebird');
const Op = require("sequelize").Op;
const models  = require('../models');
const settings = require('../utils/settings');
const fs = require('fs');
const multer = require('multer');

module.exports = function(app){

	router.get('/admin/accounts', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, {administrator: true})
			.then(users => utils.render(req, res, 'admin/admin_accounts', {accounts: users, message: req.flash('error')}, 'Administrator*innen Accounts'))
		.catch(error => next(error));
	});

	router.get('/projectconfig', function(req, res, next) {
		var project = settings.project.get(undefined);
		res.json(project);
	});


	router.get('/admin/add_account', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'admin/admin_accounts_add', {})
		.catch(error => next(error));
	});

	router.get('/admin/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.destroy({
			where: {
				id: req.params.id,
				administrator: true
			}
		}).then(deleted => {
			if(deleted > 0) {
				res.json({redirect: '/admin/accounts'});
			} else {
				res.status(500).json({error: 'Es wurde kein Account gelöscht, das sollte nicht passieren!'});
			}
		}).catch(error => {
			res.status(500).json({error: error});
		});
	});


	router.post('/admin/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {

		Promise.resolve()
			.then(() => {

				if (!req.body.logon_id) {
					throw 'Login ID muss angegeben werden!';
				} else if (!req.body.ldap && !req.body.password) {
					throw 'Passwort fehlt!';
				} else if (!req.body.ldap && req.body.password != req.body.password2) {
					throw 'Passwörter sind nicht gleich!';
				}

				var length = 16,
				charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
				generatedPassword = "";
				for (var i = 0, n = charset.length; i < length; ++i) {
					generatedPassword += charset.charAt(Math.floor(Math.random() * n));
				}
				var user = {
					logon_id: req.body.logon_id,
					administrator: true
				};
				if (req.body.ldap) {
					user.ldap = true;
					user.password = generatedPassword;
				} else {
					user.ldap = false;
					user.password = req.body.password;
				}

				return models.user.create(user);
			})
			.then(() => res.send({redirect: '/admin/accounts'}))
			.catch(error => next(error));

	});

	var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, './public/images');
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname);
		}
	});

	router.post('/admin/settings', security.isLoggedInAdmin, multer({storage:storage}).single('logo_upload'), function(req, res, next) {

		Promise.resolve()
			.then(() => {

				var setSetting = function(id, value = undefined) {
					settings.project.set(id, value || req.body[id] ||settings.project.get(id));
				};

				setSetting('projectname');
				setSetting('email');
				setSetting('url');
				setSetting('theme');
				setSetting('defaults.interest_method', req.body.interest_method);
				setSetting('defaults.termination_type', req.body.termination_type);
				setSetting('defaults.termination_period', req.body.termination_period);
				setSetting('defaults.termination_period_type', req.body.termination_period_type);
				setSetting('defaults.relationships', JSON.parse(req.body.relationships) || []);
				setSetting('defaults.country', req.body.country);

				if (req.body.logo_change === 'logo_link') {
					setSetting('logo', req.body.logo_link);
				} else if (req.body.logo_change === 'logo_upload' && req.file && req.file.originalname) {
					setSetting('logo', '/public/images/' + req.file.originalname);
				}

				return settings.project.save();
			})
			.then(() => res.send({redirect: '/admin/settings'}))
			.catch(error => next(error));

	});

	router.get('/admin/settings', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, {administrator: true})
			.then(users => utils.render(req, res, 'admin/settings', {}, 'Einstellungen'))
			.catch(error => next(error));
	});

	router.get('/admin/edit_settings', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'admin/settings_edit', {})
			.catch(error => next(error));
	});

	app.use('/', router);

};
