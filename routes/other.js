var security = require('../utils/security');
var moment = require("moment");
var fs = require('fs');
var utils = require ('../utils');
var router = require('express').Router();

module.exports = function(app){
	router.get('/docx/:id', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);		
		models.user.find({
			where: {
				id: req.params.id
			}
		}).then(function(user) {
			var data = {
				"first_name": user.first_name, 
				"last_name": user.last_name, 
				"logon_id": user.logon_id, 
				"password": user.password,
				"street": user.street,
				"zip": user.zip,
				"place": user.place,
				"country": user.country,
				"telno": user.telno,
				"email": user.email,
				"IBAN": user.IBAN,
				"BIC": user.BIC
			};

		    models.file.find({
				where: {
					id: req.query.fileid
			}}).then(function(file) {
				return file.path;		
			}).catch((error) => {
				return req.query.file;
			}).then((template) => {

				utils.generateDocx(template, user.logon_id, data, req.session.project);
				var file = fs.readFileSync("./tmp/"+ user.logon_id +".docx", 'binary');

				res.setHeader('Content-Length', file.length);
				res.setHeader('Content-Type', 'application/msword');
				res.setHeader('Content-Disposition', 'inline; filename=' + user.logon_id + '.docx');
				res.write(file, 'binary');
				res.end();
			});
		});	
	});


	app.use('/', router);
};
