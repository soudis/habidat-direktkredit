/* jshint esversion: 8 */
const security = require('../utils/security');
const utils = require('../utils');
const router = require('express').Router();
const fs = require('fs');
const Op = require("sequelize").Op;
const models  = require('../models');
const multer = require('multer');

module.exports = function(app){


	router.get('/file/add/user/:id', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'file/add', { id: req.params.id, type: 'user' })
			.catch(error => next(error));
	});

	router.get('/file/get/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findByPk(req.params.id)
			.then(file => {
				var fileData = fs.readFileSync(file.path, 'binary');

				res.setHeader('Content-Length', fileData.length);
				res.setHeader('Content-Type', file.mime);
				res.setHeader('Content-Disposition', 'inline; filename="' + file.filename + '"');
				res.write(fileData, 'binary');
				res.end();
			})
			.catch(error => next(error));

	});

	router.get('/file/getpublic/:id', security.isLoggedIn, function(req, res, next) {
		models.file.findByPk(req.params.id)
			.then(file => {
				if (file.ref_table.startsWith("infopack_")) {
					var fileData = fs.readFileSync(file.path, 'binary');

					res.setHeader('Content-Length', fileData.length);
					res.setHeader('Content-Type', file.mime);
					res.setHeader('Content-Disposition', 'inline; filename="' + file.filename + '"');
					res.write(fileData, 'binary');
					res.end();

				} else {
					res.send(404);
				}
			})
			.catch(error => next(error));
	});

	router.get('/file/delete/user/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findByPk(req.params.id)
			.then(function(file) {
				fs.unlinkSync(file.path);
				file.destroy();
				return models.file.getFilesFor('user', file.ref_id)
					.then(files => utils.render(req,res,'file/show', {files: files, type: 'user', id: req.params.id}));
			})
			.catch(error => next(error));

	});

	router.get('/file/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findByPk(req.params.id)
			.then(function(file) {
				fs.unlinkSync(file.path);
				return file.destroy();

			})
			.then(() => res.send({redirect: 'reload'}))
			.catch(error => next(error));

	});

	router.post('/file/add/user', security.isLoggedInAdmin, multer({dest:'./upload/'}).single('file'), function(req, res, next) {
		models.file.create({
				filename: req.file.originalname,
				description: req.body.description,
				mime: req.file.mimetype,
				path: req.file.path,
				ref_id: req.body.id,
				ref_table: req.body.type
			})
			.then(() => models.file.getFilesFor('user', req.body.id))
			.then(files => utils.render(req, res, 'file/show', {files: files, type: 'user', id: req.body.id}))
			.catch(error => next(error));
	});

	router.get('/admin/templates', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findAll({
			where: {
				ref_table: {
					[Op.like]: "template_%"
				}
			}
		}).then(function(templates) {
			res.render('admin/templates', { title: 'Vorlagen', templates:templates });
		});
	});

	router.get('/admin/infopack', security.isLoggedInAdmin, function(req, res, next) {
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
			res.render('admin/infopack', { title: 'Downloads für Direktkreditgeber*innen', groups: groups });
		});
	});

	router.get('/admin/addtemplate/:type', security.isLoggedInAdmin, function(req, res, next) {
		var titles = {
			infopack_balance: "Jahresabschluss hochladen",
			infopack_infopack: "Kreditinformation hochladen",
			infopack_other: "Sonstige Datei hochladen",
			template_account_notification: "Vorlage für Buchhaltungsbestätigung überschreiben",
			template_user: "Vorlage für Kreditgeber*innen hochladen",
			template_contract: "Vorlage für Kredite hochladen"
		};
		utils.render(req, res, 'admin/template_add', {type: req.params.type, formTitle: titles[req.params.type]})
			.catch(error => next(error));
	});

	router.post('/admin/addtemplate', security.isLoggedInAdmin, multer({dest:'./upload/'}).single('file'), function(req, res, next) {
		var type = req.body.type;
		Promise.resolve()
			.then(() => {
				if (type == "template_account_notification") {
				    return models.file.findOne({ where: { ref_table: "template_account_notification"	}})
				    	.then(function(file) {
							if (file && file.path) {
								fs.unlinkSync(file.path);
								return file.destroy();
							} else {
								return;
							}
						});
				} else {
					return;
				}
			})
			.then(() => models.file.create({
							filename: req.file.originalname,
							description: req.body.description,
							mime: req.file.mimetype,
							path: req.file.path,
							ref_id: 1,
							ref_table: type
						}))
			.then(() => res.json({redirect: 'reload'}))
			.catch(error => res.status(500).json({error: error}));
	});

	app.use('/', router);
};
