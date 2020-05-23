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
				file.destroy({trackOptions: utils.getTrackOptions(req.user, true)});
				return models.file.getFilesFor('user', file.ref_id)
					.then(files => utils.render(req,res,'file/show', {files: files, type: 'user', id: req.params.id}));
			})
			.catch(error => next(error));

	});

	router.get('/file/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.file.findByPk(req.params.id)
			.then(function(file) {
				fs.unlinkSync(file.path);
				return file.destroy({trackOptions: utils.getTrackOptions(req.user, true)});

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
			}, { trackOptions: utils.getTrackOptions(req.user, true) })
			.then(() => models.file.getFilesFor('user', req.body.id))
			.then(files => utils.render(req, res, 'file/show', {files: files, type: 'user', id: req.body.id}))
			.catch(error => next(error));
	});

	app.use('/', router);
};
