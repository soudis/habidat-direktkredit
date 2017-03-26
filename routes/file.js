var security = require('../utils/security');
var router = require('express').Router();
var fs = require('fs');

module.exports = function(app){


	router.get('/file/add/:type/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		if (req.params.type === 'user') {
			models.user.findByIdFetchFull(models, req.params.id, function(user) {
				res.render('user/show', { user:user, addFile:req.params.type, title: 'Dateiupload' });
			});	
		}
	});
	
	router.get('/file/get/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.file.findById(req.params.id).then(function(file) {
			var fileData = fs.readFileSync(file.path, 'binary');

			res.setHeader('Content-Length', fileData.length);
			res.setHeader('Content-Type', file.mime);
			res.setHeader('Content-Disposition', 'inline; filename=' + file.filename);
			res.write(fileData, 'binary');
			res.end();			});	

	});
	
	router.get('/file/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		
		var models  = require('../models')(req.session.project);
		models.file.findById(req.params.id).then(function(file) {
			if (file.ref_table === 'user') {
				fs.unlinkSync(file.path);  
				file.destroy();
			}
			res.redirect(security.redirectReload(req.headers.referer));
		});

	});
	
	router.post('/file/add', security.isLoggedInAdmin, function(req, res) {
		console.log(req.file);
		var models  = require('../models')(req.session.project);
		if (req.body.type === 'user') {
			
			models.file.create({
				filename: req.file.originalname,
				description: req.body.description,
				mime: req.file.mimetype,
				path: req.file.path,
				ref_id: req.body.id,
				ref_table: req.body.type
			}).then(function(transaction) {
				res.redirect('/user/show/' + req.body.id);
			}).catch(function(err) {
				models.user.findByIdFetchFull(models,req.body.id,function(user) {
					res.render('user/show', { user:user, addFile:"user", title: 'Dateiupload', message: err.message });
				});	
			});
		}
	});

	app.use('/', router);
};
