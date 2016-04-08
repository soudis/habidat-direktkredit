var models  = require('../../models');
var moment = require("moment");
var url = require('url');

//route middleware to make sure a user is logged in
exports.isLoggedIn = function(req, res, next) {
	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
    	return next();
	// 	if they aren't redirect them to the home page
	res.redirect('/');
};

//route middleware to make sure a user is logged in
exports.isLoggedInAdmin = function(req, res, next) {
	// 	if user is authenticated in the session, carry on 
	if (req.isAuthenticated() && req.user.isAdmin())
		return next();
	else if (req.isAuthenticated())
		req.logout();
	// if they aren't redirect them to the home page
	res.redirect('/admin-logon');
};

exports.redirectReload = function(redirectUrl) {
	  var u = url.parse(redirectUrl, true, false);
	  u.query['v'] = +new Date(); // add versioning to bust cache 
	  delete u.search;
	  return url.format(u);
	};