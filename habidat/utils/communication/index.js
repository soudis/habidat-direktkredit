var models  = require('../../models');
var moment = require("moment");


exports.getEmails = function(mode, callback){

	var whereClause = ['administrator <> 1'];
	var usersString = 'test';
	
	models.user.findFetchFull(models, whereClause, function(users){
		users.forEach(function(user){
			var add;
			if (user.email && (mode == 'all' || user.isActive())) {
				usersString += user.email + ',';
			} 
		});
		callback(usersString);
	});
	

};


