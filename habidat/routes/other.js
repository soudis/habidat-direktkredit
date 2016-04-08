var models  = require('../models');
var security = require('../utils/security');
var moment = require("moment");
var fs = require('fs');
var utils = require ('../utils');
var router = require('express').Router();

module.exports = function(app){
	router.get('/docx/:id', security.isLoggedInAdmin, function(req, res) {
		
		models.user.find({
			where: {
				id: req.params.id
			}
		}).then(function(user) {
			var data = {"first_name": user.first_name, "logon_id": user.logon_id, "password": user.password};
			utils.generateDocx(req.query.file, user.logon_id, data);
			var file = fs.readFileSync("./tmp/"+ user.logon_id +".docx", 'binary');

			res.setHeader('Content-Length', file.length);
			res.setHeader('Content-Type', 'application/msword');
			res.setHeader('Content-Disposition', 'inline; filename=' + user.logon_id + '.docx');
			res.write(file, 'binary');
			res.end();
		});	
	});

	app.use('/', router);
};
