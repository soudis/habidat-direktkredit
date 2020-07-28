/* jshint esversion: 8 */
const models  = require('../models');
const moment = require("moment");
const validator = require("validator");
const Op = require("sequelize").Op;

exports.getEmails = function(mode){
	var usersString = '';
	return models.user.findFetchFull(models, { })
		.then(users => {
			users.forEach(function(user){
				var add;
				if (user.email && validator.isEmail(user.email) && (mode === 'all' || user.isActive())) {
					usersString += user.email + ',';
				}
			});
			return usersString;
		});
};


