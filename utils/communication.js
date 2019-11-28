var models  = require('../models');
var moment = require("moment");
var validator = require("validator");
var Op = require("sequelize").Op;

exports.getEmails = function(mode, project, callback){

	var whereClause = { administrator: {[Op.not]: '1'}};
	var usersString = 'test';
	var models  = require('../models')(project);  
	models.user.findFetchFull(models, whereClause, function(users){
		users.forEach(function(user){
			var add;
			if (user.email && validator.isEmail(user.email) && (mode === 'all' || user.isActive())) {
				usersString += user.email + ',';
			} 
		});
		callback(usersString);
	});
	

};


