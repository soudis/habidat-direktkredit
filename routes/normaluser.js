/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const utils = require('../utils');
const fs = require('fs');
const numeral = require('numeral');
const format = require('../utils/format');
const router = require('express').Router();
const models  = require('../models');
const Op = require("sequelize").Op;

const intl = require('../utils/intl');

const multer = require('multer');

module.exports = function(app){

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	router.get('/profile', security.isLoggedIn, function(req, res, next) {
		if (req.user.dn || req.user.isAdmin()) {
			res.redirect(utils.generateUrl(req, '/admin'));
		} else {
			models.user.findByIdFetchFull(models, req.user.id)
				.then((user) => {
					res.render('profile', {
						user : user, // get the user out of session and pass to template
						title: "Direktkreditinfo",
						success: req.flash('success')
					});
				})
				.catch(error => next(error));
		}
	});

	router.get('/files', security.isLoggedIn, function(req, res, next) {
		models.file.findAll({
			where: {
				ref_table: {
			      [Op.like]: "infopack_%"
			    }
			}
		}).then(function(files) {
			groups = {
				balance: {
					title: "Jahresabschlüsse",
					files: []
				},
				infopack: {
					title: "Direktkreditinformationen",
					files: []
				},
				other: {
					title: "Sonstige Dateien",
					files: []
				}
			};
			files.map((file => {
				var group = file.ref_table.split("_")[1];
				file.group = group;
				if (groups[group]) {
					groups[group].files.push(file);
				}
			}));
			return models.user.findByIdFetchFull(models, req.user.id)
				.then(user => {
					res.render('files', { user:user, title: 'Dateien und Informationen zum Projekt', groups: groups });
				})

		})
		.catch(error => next(error));
	});


	router.post('/accountnotification', security.isLoggedIn, multer().none(),function(req, res, next) {
		models.user.findByIdFetchFull(models, req.user.id)
			.then(user => {

				data = user.getAccountNotificationData(req.body.year);

				var filename =  "Kontomitteilung " + user.id + " " + req.body.year;

			    return models.file.findOne({
						where: {
							ref_table: "template_account_notification"
						}
					})
			    	.then(template => {
						return utils.generateDocx(template.path, data)
							.then(result => utils.convertToPdf(result))
							.then(file => {
								res.setHeader('Content-Length', file.length);
								res.setHeader('Content-Type', 'application/pdf');
								res.setHeader('Content-Disposition', 'inline; filename="' + filename + '.pdf"');
								res.write(file, 'binary');
								res.end();
							})
					});

			})
			.catch(error => next(error));
	});

	app.use('/', router);
};
